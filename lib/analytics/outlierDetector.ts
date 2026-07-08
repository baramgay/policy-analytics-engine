// IQR(사분위범위) 1.5배 + Z-score(|z|>3) 병합 기준으로 수치형 컬럼별 이상치를 탐지한다
import type { OutlierColumnInfo, ParsedDataset, SchemaSummary } from "@/types/analysis";
import { quantile } from "./statsGenerator";

const Z_SCORE_THRESHOLD = 3;

export function detectOutliers(
  dataset: ParsedDataset,
  schema: SchemaSummary
): OutlierColumnInfo[] {
  const numericColumns = schema.columns.filter((c) => c.type === "numeric");

  return numericColumns.map((column) => {
    const values: number[] = [];
    dataset.rows.forEach((row) => {
      const v = row[column.name];
      if (typeof v === "number") values.push(v);
    });

    const sorted = [...values].sort((a, b) => a - b);
    const q1 = quantile(sorted, 0.25);
    const q3 = quantile(sorted, 0.75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const mean = values.length === 0 ? 0 : values.reduce((sum, v) => sum + v, 0) / values.length;
    const stdDev =
      values.length < 2
        ? 0
        : Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1));

    const iqrFlagged = new Set<number>();
    const zScoreFlagged = new Set<number>();
    dataset.rows.forEach((row, index) => {
      const v = row[column.name];
      if (typeof v !== "number") return;
      if (v < lowerBound || v > upperBound) iqrFlagged.add(index);
      if (stdDev > 0 && Math.abs((v - mean) / stdDev) > Z_SCORE_THRESHOLD) {
        zScoreFlagged.add(index);
      }
    });

    const highConfidenceIndices: number[] = [];
    const referenceIndices: number[] = [];
    const allFlagged = new Set([...iqrFlagged, ...zScoreFlagged]);
    for (const index of allFlagged) {
      if (iqrFlagged.has(index) && zScoreFlagged.has(index)) {
        highConfidenceIndices.push(index);
      } else {
        referenceIndices.push(index);
      }
    }
    highConfidenceIndices.sort((a, b) => a - b);
    referenceIndices.sort((a, b) => a - b);
    const outlierIndices = [...allFlagged].sort((a, b) => a - b);

    return {
      column: column.name,
      lowerBound: Number(lowerBound.toFixed(2)),
      upperBound: Number(upperBound.toFixed(2)),
      outlierCount: outlierIndices.length,
      outlierIndices,
      highConfidenceIndices,
      referenceIndices,
    };
  });
}
