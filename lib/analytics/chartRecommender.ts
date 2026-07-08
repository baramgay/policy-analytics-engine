// 스키마·통계 결과를 근거로 표현 가능한 차트(Bar/Line/Pie/Grouped-Bar/Scatter)를 규칙 기반으로 추천한다
import type {
  CategoricalColumnStats,
  ChartSpec,
  CorrelationPair,
  GroupComparisonResult,
  NumericColumnStats,
  ParsedDataset,
  SchemaSummary,
} from "@/types/analysis";

const SCATTER_MAX_POINTS = 300;

function buildScatterSpec(dataset: ParsedDataset, pair: CorrelationPair): ChartSpec | null {
  const { columnA, columnB } = pair;
  const rawPoints: { x: number; y: number }[] = [];
  for (const row of dataset.rows) {
    const x = row[columnA];
    const y = row[columnB];
    if (typeof x === "number" && typeof y === "number") {
      rawPoints.push({ x, y });
    }
  }
  if (rawPoints.length < 3) return null;

  // 회귀계수는 다운샘플 이전의 전체 원본 데이터를 기준으로 계산한다 (편향 방지)
  const n = rawPoints.length;
  const meanX = rawPoints.reduce((sum, p) => sum + p.x, 0) / n;
  const meanY = rawPoints.reduce((sum, p) => sum + p.y, 0) / n;
  const sxx = rawPoints.reduce((sum, p) => sum + (p.x - meanX) * (p.x - meanX), 0);
  const sxy = rawPoints.reduce((sum, p) => sum + (p.x - meanX) * (p.y - meanY), 0);

  const trendLine =
    sxx === 0
      ? null
      : (() => {
          const slope = sxy / sxx;
          const intercept = meanY - slope * meanX;
          const xValues = rawPoints.map((p) => p.x);
          const minX = Math.min(...xValues);
          const maxX = Math.max(...xValues);
          const segment: readonly [{ x: number; y: number }, { x: number; y: number }] = [
            { x: minX, y: slope * minX + intercept },
            { x: maxX, y: slope * maxX + intercept },
          ];
          return { slope, intercept, segment };
        })();

  // 렌더링용 점 배열만 균등 스트라이드로 다운샘플링한다 (회귀계수 계산과는 분리)
  const step = Math.max(1, Math.ceil(rawPoints.length / SCATTER_MAX_POINTS));
  const points = rawPoints.filter((_, index) => index % step === 0);

  const pText = pair.pValue < 0.001 ? "p<0.001" : `p=${pair.pValue.toFixed(4)}`;

  return {
    id: `scatter-${columnA}-${columnB}`,
    type: "scatter",
    title: `${columnA}과(와) ${columnB}의 관계`,
    xKey: columnA,
    yKey: columnB,
    data: points.map((p) => ({ [columnA]: p.x, [columnB]: p.y })),
    subtitle: `상관계수 ${pair.coefficient.toFixed(2)}, ${pText} (유의)`,
    trendLine,
  };
}

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
  categoricalSummary: CategoricalColumnStats[],
  groupComparisonSummary?: GroupComparisonResult[],
  correlationSummary?: CorrelationPair[]
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

  if (groupComparisonSummary && groupComparisonSummary.length > 0) {
    const mostSignificant = [...groupComparisonSummary].sort((a, b) => a.pValue - b.pValue)[0];
    specs.push({
      id: `grouped-${mostSignificant.groupColumn}-${mostSignificant.numericColumn}`,
      type: "grouped-bar",
      title: `${mostSignificant.groupColumn}별 ${mostSignificant.numericColumn} 그룹 비교`,
      xKey: mostSignificant.groupColumn,
      yKey: "mean",
      data: mostSignificant.groupMeans.map((g) => ({
        [mostSignificant.groupColumn]: g.group,
        mean: g.mean,
        count: g.count,
      })),
    });
  }

  if (correlationSummary && correlationSummary.length > 0) {
    const significantPairs = correlationSummary
      .filter((pair) => pair.significant)
      .sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
    const topPair = significantPairs[0];
    if (topPair) {
      const scatterSpec = buildScatterSpec(dataset, topPair);
      if (scatterSpec) {
        specs.push(scatterSpec);
      }
    }
  }

  return specs;
}
