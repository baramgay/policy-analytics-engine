// 날짜 컬럼 + 수치형 컬럼 조합에 대해 단순 선형추세와 이동평균을 계산한다 (STL/계절분해는 범위 밖)
import type {
  ParsedDataset,
  SchemaSummary,
  TimeSeriesAnalysis,
  TimeSeriesPoint,
} from "@/types/analysis";

const MOVING_AVERAGE_WINDOW = 3;
const TREND_FLAT_THRESHOLD = 0.01;

function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0 };

  const xs = values.map((_, i) => i);
  const meanX = xs.reduce((sum, v) => sum + v, 0) / n;
  const meanY = values.reduce((sum, v) => sum + v, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (xs[i] - meanX) * (values[i] - meanY);
    denominator += (xs[i] - meanX) ** 2;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = meanY - slope * meanX;
  return { slope, intercept };
}

function movingAverage(values: number[], window: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < window - 1) return null;
    const slice = values.slice(i - window + 1, i + 1);
    return Number((slice.reduce((sum, v) => sum + v, 0) / window).toFixed(2));
  });
}

function resolveMonthKey(dateValue: string): string | null {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
}

function computeMomYoy(
  sortedEntries: [string, { sum: number; count: number }][]
): { momChange: number | null; yoyChange: number | null } {
  const monthValues = new Map<string, number>();
  for (const [key, { sum, count }] of sortedEntries) {
    const monthKey = resolveMonthKey(key);
    if (!monthKey) return { momChange: null, yoyChange: null };
    if (monthValues.has(monthKey)) return { momChange: null, yoyChange: null };
    monthValues.set(monthKey, sum / count);
  }

  const monthKeys = Array.from(monthValues.keys()).sort();
  const latestKey = monthKeys[monthKeys.length - 1];
  const [latestYear, latestMonth] = latestKey.split("-").map(Number);
  const latestValue = monthValues.get(latestKey)!;

  const priorMonthDate = new Date(latestYear, latestMonth - 2, 1);
  const priorMonthKey = `${priorMonthDate.getFullYear()}-${String(priorMonthDate.getMonth() + 1).padStart(2, "0")}`;
  const priorYearKey = `${latestYear - 1}-${String(latestMonth).padStart(2, "0")}`;

  const priorMonthValue = monthValues.get(priorMonthKey);
  const priorYearValue = monthValues.get(priorYearKey);

  const momChange =
    priorMonthValue !== undefined && priorMonthValue !== 0
      ? Number((((latestValue - priorMonthValue) / priorMonthValue) * 100).toFixed(2))
      : null;
  const yoyChange =
    priorYearValue !== undefined && priorYearValue !== 0
      ? Number((((latestValue - priorYearValue) / priorYearValue) * 100).toFixed(2))
      : null;

  return { momChange, yoyChange };
}

export function generateTimeSeriesSummary(
  dataset: ParsedDataset,
  schema: SchemaSummary
): TimeSeriesAnalysis[] {
  const dateColumns = schema.columns.filter((c) => c.type === "date");
  const numericColumns = schema.columns.filter((c) => c.type === "numeric");
  const results: TimeSeriesAnalysis[] = [];

  for (const dateColumn of dateColumns) {
    for (const numericColumn of numericColumns) {
      const totals = new Map<string, { sum: number; count: number }>();
      for (const row of dataset.rows) {
        const dateValue = row[dateColumn.name];
        const numericValue = row[numericColumn.name];
        if (dateValue === null || typeof numericValue !== "number") continue;
        const key = String(dateValue);
        const entry = totals.get(key) ?? { sum: 0, count: 0 };
        entry.sum += numericValue;
        entry.count += 1;
        totals.set(key, entry);
      }

      const sortedEntries = Array.from(totals.entries()).sort((a, b) =>
        a[0].localeCompare(b[0])
      );
      if (sortedEntries.length < 2) continue;

      const values = sortedEntries.map(([, { sum, count }]) => sum / count);
      const { slope, intercept } = linearRegression(values);
      const averages = movingAverage(values, MOVING_AVERAGE_WINDOW);

      const points: TimeSeriesPoint[] = sortedEntries.map(([date], i) => ({
        date,
        value: Number(values[i].toFixed(2)),
        movingAverage: averages[i],
      }));

      const trendDirection =
        slope > TREND_FLAT_THRESHOLD ? "증가" : slope < -TREND_FLAT_THRESHOLD ? "감소" : "보합";
      const { momChange, yoyChange } = computeMomYoy(sortedEntries);

      results.push({
        dateColumn: dateColumn.name,
        numericColumn: numericColumn.name,
        trendSlope: Number(slope.toFixed(4)),
        trendIntercept: Number(intercept.toFixed(2)),
        trendDirection,
        points,
        momChange,
        yoyChange,
      });
    }
  }

  return results;
}
