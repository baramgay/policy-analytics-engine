// 결측치·중복행·이상치를 진단하고(analyzePreprocessing) 선택된 전략에 따라 실제로 정제한다(applyPreprocessing)
import type {
  ParsedDataset,
  PreprocessingOptions,
  PreprocessingReport,
  PreprocessingSuggestion,
  SchemaSummary,
} from "@/types/analysis";
import { checkQuality, computeQualityScore } from "./qualityChecker";

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

function iqrBounds(values: number[]): { lower: number; upper: number } {
  const q1 = quantile(values, 0.25);
  const q3 = quantile(values, 0.75);
  const iqr = q3 - q1;
  return { lower: q1 - iqr * 1.5, upper: q3 + iqr * 1.5 };
}

function rowSignature(dataset: ParsedDataset, row: Record<string, string | number | null>): string {
  return dataset.columns.map((c) => row[c]).join("|");
}

function mostFrequentValue(values: (string | number | null)[]): string | number | null {
  const counts = new Map<string | number, number>();
  for (const v of values) {
    if (v === null) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best: string | number | null = null;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

export function analyzePreprocessing(
  dataset: ParsedDataset,
  schema: SchemaSummary
): PreprocessingSuggestion {
  const missingSummary = checkQuality(dataset, schema);

  const outlierColumns = schema.columns
    .filter((c) => c.type === "numeric")
    .map((column) => {
      const values = dataset.rows
        .map((row) => row[column.name])
        .filter((v): v is number => typeof v === "number");
      const sorted = [...values].sort((a, b) => a - b);
      const { lower, upper } = iqrBounds(sorted);
      const outlierCount = values.filter((v) => v < lower || v > upper).length;
      return { column: column.name, outlierCount };
    })
    .filter((c) => c.outlierCount > 0);

  return {
    missingRate: missingSummary.overallMissingRate,
    duplicateRowCount: missingSummary.duplicateRowCount,
    outlierColumns,
    recommended: {
      missingStrategy: missingSummary.overallMissingRate > 0 ? "fill" : "keep",
      duplicateStrategy: missingSummary.duplicateRowCount > 0 ? "drop" : "keep",
      outlierStrategy: outlierColumns.length > 0 ? "cap-iqr" : "keep",
    },
  };
}

export function applyPreprocessing(
  dataset: ParsedDataset,
  schema: SchemaSummary,
  options: PreprocessingOptions
): { dataset: ParsedDataset; report: PreprocessingReport } {
  const missingSummaryBefore = checkQuality(dataset, schema);
  const qualityScoreBefore = computeQualityScore(missingSummaryBefore, dataset.rows.length);

  let rows = dataset.rows.map((row) => ({ ...row }));
  let droppedRowCount = 0;

  if (options.duplicateStrategy === "drop") {
    const seen = new Set<string>();
    const deduped: typeof rows = [];
    for (const row of rows) {
      const signature = rowSignature(dataset, row);
      if (seen.has(signature)) {
        droppedRowCount += 1;
        continue;
      }
      seen.add(signature);
      deduped.push(row);
    }
    rows = deduped;
  }

  const filledCellCount: { column: string; count: number; fillValue: string | number }[] = [];

  if (options.missingStrategy === "drop-row") {
    const before = rows.length;
    rows = rows.filter((row) => dataset.columns.every((c) => row[c] !== null));
    droppedRowCount += before - rows.length;
  } else if (options.missingStrategy === "fill") {
    for (const column of schema.columns) {
      const missingCount = rows.filter((row) => row[column.name] === null).length;
      if (missingCount === 0) continue;

      let fillValue: string | number;
      if (column.type === "numeric") {
        const values = rows
          .map((row) => row[column.name])
          .filter((v): v is number => typeof v === "number");
        const mean = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
        fillValue = Number(mean.toFixed(2));
      } else {
        const values = rows.map((row) => row[column.name]);
        fillValue = mostFrequentValue(values) ?? "";
      }

      for (const row of rows) {
        if (row[column.name] === null) row[column.name] = fillValue;
      }
      filledCellCount.push({ column: column.name, count: missingCount, fillValue });
    }
  }

  const cappedOutlierCount: { column: string; count: number }[] = [];

  if (options.outlierStrategy === "cap-iqr") {
    for (const column of schema.columns) {
      if (column.type !== "numeric") continue;
      const values = rows
        .map((row) => row[column.name])
        .filter((v): v is number => typeof v === "number")
        .sort((a, b) => a - b);
      if (values.length === 0) continue;
      const { lower, upper } = iqrBounds(values);

      let count = 0;
      for (const row of rows) {
        const value = row[column.name];
        if (typeof value !== "number") continue;
        if (value < lower) {
          row[column.name] = Number(lower.toFixed(2));
          count += 1;
        } else if (value > upper) {
          row[column.name] = Number(upper.toFixed(2));
          count += 1;
        }
      }
      if (count > 0) cappedOutlierCount.push({ column: column.name, count });
    }
  }

  const cleanedDataset: ParsedDataset = { columns: dataset.columns, rows };
  const missingSummaryAfter = checkQuality(cleanedDataset, schema);
  const qualityScoreAfter = computeQualityScore(missingSummaryAfter, rows.length);

  return {
    dataset: cleanedDataset,
    report: {
      options,
      droppedRowCount,
      filledCellCount,
      cappedOutlierCount,
      qualityScoreBefore,
      qualityScoreAfter,
    },
  };
}
