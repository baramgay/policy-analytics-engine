// 스키마·통계 결과를 근거로 표현 가능한 차트(Bar/Line/Pie)를 규칙 기반으로 추천한다
import type {
  CategoricalColumnStats,
  ChartSpec,
  NumericColumnStats,
  ParsedDataset,
  SchemaSummary,
} from "@/types/analysis";

function buildTimeSeries(
  dataset: ParsedDataset,
  dateColumn: string,
  numericColumn: string
): Record<string, string | number>[] {
  const totals = new Map<string, { sum: number; count: number }>();
  for (const row of dataset.rows) {
    const dateValue = row[dateColumn];
    const numericValue = row[numericColumn];
    if (dateValue === null || typeof numericValue !== "number") continue;
    const key = String(dateValue);
    const entry = totals.get(key) ?? { sum: 0, count: 0 };
    entry.sum += numericValue;
    entry.count += 1;
    totals.set(key, entry);
  }
  return Array.from(totals.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, { sum, count }]) => ({
      [dateColumn]: date,
      [numericColumn]: Number((sum / count).toFixed(2)),
    }));
}

export function recommendCharts(
  dataset: ParsedDataset,
  schema: SchemaSummary,
  numericSummary: NumericColumnStats[],
  categoricalSummary: CategoricalColumnStats[]
): ChartSpec[] {
  const specs: ChartSpec[] = [];
  const dateColumn = schema.columns.find((c) => c.type === "date");
  const primaryNumeric = numericSummary[0];

  if (dateColumn && primaryNumeric) {
    specs.push({
      id: `line-${dateColumn.name}-${primaryNumeric.column}`,
      type: "line",
      title: `${dateColumn.name}에 따른 ${primaryNumeric.column} 추이`,
      xKey: dateColumn.name,
      yKey: primaryNumeric.column,
      data: buildTimeSeries(dataset, dateColumn.name, primaryNumeric.column),
    });
  }

  const primaryCategorical = categoricalSummary[0];
  if (primaryCategorical) {
    specs.push({
      id: `bar-${primaryCategorical.column}`,
      type: "bar",
      title: `${primaryCategorical.column}별 분포`,
      xKey: primaryCategorical.column,
      yKey: "count",
      data: primaryCategorical.topValues.map((v) => ({
        [primaryCategorical.column]: v.value,
        count: v.count,
      })),
    });

    specs.push({
      id: `pie-${primaryCategorical.column}`,
      type: "pie",
      title: `${primaryCategorical.column} 구성 비율`,
      xKey: primaryCategorical.column,
      yKey: "count",
      data: primaryCategorical.topValues.slice(0, 6).map((v) => ({
        [primaryCategorical.column]: v.value,
        count: v.count,
      })),
    });
  }

  if (categoricalSummary[1] && primaryNumeric) {
    const second = categoricalSummary[1];
    specs.push({
      id: `bar-${second.column}-${primaryNumeric.column}`,
      type: "bar",
      title: `${second.column}별 ${primaryNumeric.column} 비교`,
      xKey: second.column,
      yKey: "count",
      data: second.topValues.map((v) => ({
        [second.column]: v.value,
        count: v.count,
      })),
    });
  }

  return specs;
}
