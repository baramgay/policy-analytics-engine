// 범주형(그룹) 컬럼과 수치형 컬럼 조합에 대해 그룹간 차이검정을 직접 구현한다
// 2그룹: Welch's t-test, 3그룹 이상: One-way ANOVA F-statistic (외부 통계 라이브러리 미사용)
import type { EffectSize, GroupComparisonResult, ParsedDataset, SchemaSummary } from "@/types/analysis";
import { tTestPValue, fTestPValue } from "./statUtils";

const MAX_GROUP_COUNT = 20;
const SIGNIFICANCE_LEVEL = 0.05;

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function variance(values: number[], groupMean: number): number {
  if (values.length < 2) return 0;
  return values.reduce((sum, v) => sum + (v - groupMean) ** 2, 0) / (values.length - 1);
}

function classifyCohenD(d: number): "작음" | "중간" | "큼" {
  const abs = Math.abs(d);
  if (abs >= 0.8) return "큼";
  if (abs >= 0.5) return "중간";
  return "작음";
}

function classifyEtaSquared(eta: number): "작음" | "중간" | "큼" {
  if (eta >= 0.14) return "큼";
  if (eta >= 0.06) return "중간";
  return "작음";
}

function buildGroupInterpretation(
  significant: boolean,
  pValue: number,
  effectSize: EffectSize | null
): string {
  const pText = pValue < 0.001 ? "p<0.001" : `p=${pValue.toFixed(4)}`;
  if (!significant) {
    return `${pText}로 그룹 간 차이가 통계적으로 유의하지 않음`;
  }
  if (!effectSize) {
    return `${pText}로 통계적으로 유의함`;
  }
  const label = effectSize.type === "cohen_d" ? `d=${effectSize.value}` : `η²=${effectSize.value}`;
  if (effectSize.magnitude === "작음") {
    return `${pText}로 유의하나 효과크기(${label})는 작아 실질적 차이는 크지 않음`;
  }
  return `${pText}로 유의하며 효과크기(${label})도 ${effectSize.magnitude}`;
}

function welchTTest(
  a: number[],
  b: number[]
): { statistic: number; pValue: number; effectSize: EffectSize | null } {
  const meanA = mean(a);
  const meanB = mean(b);
  const varA = variance(a, meanA);
  const varB = variance(b, meanB);
  const seSq = varA / a.length + varB / b.length;
  const se = Math.sqrt(seSq);
  const t = se === 0 ? 0 : (meanA - meanB) / se;

  let df = a.length + b.length - 2;
  const dfDenominator =
    (varA / a.length) ** 2 / (a.length - 1) + (varB / b.length) ** 2 / (b.length - 1);
  if (seSq > 0 && dfDenominator > 0) {
    df = (seSq * seSq) / dfDenominator;
  }

  const pValue = tTestPValue(Math.abs(t), df);

  const pooledVariance = ((a.length - 1) * varA + (b.length - 1) * varB) / (a.length + b.length - 2);
  const pooledSd = Math.sqrt(pooledVariance);
  const effectSize: EffectSize | null =
    pooledSd === 0
      ? null
      : {
          type: "cohen_d",
          value: Number(((meanA - meanB) / pooledSd).toFixed(3)),
          magnitude: classifyCohenD((meanA - meanB) / pooledSd),
        };

  return { statistic: t, pValue, effectSize };
}

function oneWayAnova(
  groups: number[][]
): { statistic: number; pValue: number; dfWithin: number; effectSize: EffectSize | null } {
  const allValues = groups.flat();
  const grandMean = mean(allValues);

  let ssBetween = 0;
  let ssWithin = 0;
  for (const group of groups) {
    const groupMean = mean(group);
    ssBetween += group.length * (groupMean - grandMean) ** 2;
    ssWithin += group.reduce((sum, v) => sum + (v - groupMean) ** 2, 0);
  }

  const ssTotal = ssBetween + ssWithin;
  const effectSize: EffectSize | null =
    ssTotal === 0
      ? null
      : {
          type: "eta_squared",
          value: Number((ssBetween / ssTotal).toFixed(3)),
          magnitude: classifyEtaSquared(ssBetween / ssTotal),
        };

  const dfBetween = groups.length - 1;
  const dfWithin = allValues.length - groups.length;
  if (dfWithin <= 0) return { statistic: 0, pValue: 1, dfWithin, effectSize };

  const msBetween = ssBetween / dfBetween;
  const msWithin = ssWithin / dfWithin;
  const f = msWithin === 0 ? 0 : msBetween / msWithin;
  const pValue = fTestPValue(f, dfBetween, dfWithin);

  return { statistic: f, pValue, dfWithin, effectSize };
}

export function generateGroupComparisonSummary(
  dataset: ParsedDataset,
  schema: SchemaSummary
): GroupComparisonResult[] {
  const groupColumns = schema.columns.filter(
    (c) => c.type === "categorical" || c.type === "boolean"
  );
  const numericColumns = schema.columns.filter((c) => c.type === "numeric");
  const results: GroupComparisonResult[] = [];

  for (const groupColumn of groupColumns) {
    for (const numericColumn of numericColumns) {
      const groupedValues = new Map<string, number[]>();
      for (const row of dataset.rows) {
        const groupValue = row[groupColumn.name];
        const numericValue = row[numericColumn.name];
        if (groupValue === null || typeof numericValue !== "number") continue;
        const key = String(groupValue);
        const arr = groupedValues.get(key) ?? [];
        arr.push(numericValue);
        groupedValues.set(key, arr);
      }

      const validGroups = Array.from(groupedValues.entries()).filter(
        ([, values]) => values.length >= 2
      );
      if (validGroups.length < 2 || validGroups.length > MAX_GROUP_COUNT) continue;

      const groupMeans = validGroups.map(([group, values]) => ({
        group,
        mean: Number(mean(values).toFixed(2)),
        count: values.length,
      }));

      if (validGroups.length === 2) {
        const [a, b] = validGroups.map(([, values]) => values);
        const { statistic, pValue, effectSize } = welchTTest(a, b);
        const significant = pValue < SIGNIFICANCE_LEVEL;
        results.push({
          groupColumn: groupColumn.name,
          numericColumn: numericColumn.name,
          method: "welch-t",
          groupCount: 2,
          statistic: Number(statistic.toFixed(3)),
          pValue: Number(pValue.toFixed(4)),
          significant,
          groupMeans,
          effectSize,
          interpretation: buildGroupInterpretation(significant, Number(pValue.toFixed(4)), effectSize),
        });
      } else {
        const groups = validGroups.map(([, values]) => values);
        const { statistic, pValue, effectSize } = oneWayAnova(groups);
        const significant = pValue < SIGNIFICANCE_LEVEL;
        results.push({
          groupColumn: groupColumn.name,
          numericColumn: numericColumn.name,
          method: "anova-f",
          groupCount: validGroups.length,
          statistic: Number(statistic.toFixed(3)),
          pValue: Number(pValue.toFixed(4)),
          significant,
          groupMeans,
          effectSize,
          interpretation: buildGroupInterpretation(significant, Number(pValue.toFixed(4)), effectSize),
        });
      }
    }
  }

  return results;
}
