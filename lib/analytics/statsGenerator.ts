// 수치형 컬럼의 기술통계와 범주형 컬럼의 빈도 분포를 계산한다
import type {
  CategoricalColumnStats,
  NumericColumnStats,
  ParsedDataset,
  SchemaSummary,
} from "@/types/analysis";

export function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

export function generateNumericSummary(
  dataset: ParsedDataset,
  schema: SchemaSummary
): NumericColumnStats[] {
  const numericColumns = schema.columns.filter((c) => c.type === "numeric");

  return numericColumns.map((column) => {
    const values = dataset.rows
      .map((row) => row[column.name])
      .filter((v): v is number => typeof v === "number")
      .sort((a, b) => a - b);

    const count = values.length;
    const mean = count > 0 ? values.reduce((sum, v) => sum + v, 0) / count : 0;
    const variance =
      count > 0
        ? values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / count
        : 0;

    return {
      column: column.name,
      count,
      mean: Number(mean.toFixed(2)),
      std: Number(Math.sqrt(variance).toFixed(2)),
      min: count > 0 ? values[0] : 0,
      max: count > 0 ? values[count - 1] : 0,
      median: Number(quantile(values, 0.5).toFixed(2)),
      q1: Number(quantile(values, 0.25).toFixed(2)),
      q3: Number(quantile(values, 0.75).toFixed(2)),
    };
  });
}

export function generateCategoricalSummary(
  dataset: ParsedDataset,
  schema: SchemaSummary
): CategoricalColumnStats[] {
  const categoricalColumns = schema.columns.filter(
    (c) => c.type === "categorical" || c.type === "boolean"
  );

  return categoricalColumns.map((column) => {
    const counts = new Map<string, number>();
    let presentCount = 0;
    for (const row of dataset.rows) {
      const raw = row[column.name];
      if (raw === null) continue;
      presentCount += 1;
      const key = String(raw);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const topValues = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([value, count]) => ({
        value,
        count,
        ratio: presentCount > 0 ? Number((count / presentCount).toFixed(3)) : 0,
      }));

    return {
      column: column.name,
      uniqueCount: counts.size,
      topValues,
    };
  });
}
