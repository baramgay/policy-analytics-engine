// IQR(사분위범위) 1.5배 기준으로 수치형 컬럼별 이상치를 탐지한다
import type { OutlierColumnInfo, ParsedDataset, SchemaSummary } from "@/types/analysis";
import { quantile } from "./statsGenerator";

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

    const outlierIndices: number[] = [];
    dataset.rows.forEach((row, index) => {
      const v = row[column.name];
      if (typeof v === "number" && (v < lowerBound || v > upperBound)) {
        outlierIndices.push(index);
      }
    });

    return {
      column: column.name,
      lowerBound: Number(lowerBound.toFixed(2)),
      upperBound: Number(upperBound.toFixed(2)),
      outlierCount: outlierIndices.length,
      outlierIndices,
    };
  });
}
