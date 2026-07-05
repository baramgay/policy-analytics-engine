// 범주형(그룹) 컬럼과 수치형 컬럼 조합에 대해 그룹간 차이검정을 직접 구현한다
// 2그룹: Welch's t-test, 3그룹 이상: One-way ANOVA F-statistic (외부 통계 라이브러리 미사용)
import type { GroupComparisonResult, ParsedDataset, SchemaSummary } from "@/types/analysis";

const MAX_GROUP_COUNT = 20;
const SIGNIFICANCE_LEVEL = 0.05;

// Lanczos 근사로 로그 감마함수를 계산한다 (불완전 베타함수 계산에 필요)
function logGamma(x: number): number {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }
  const xm1 = x - 1;
  let a = c[0];
  const t = xm1 + g + 0.5;
  for (let i = 1; i < g + 2; i++) {
    a += c[i] / (xm1 + i);
  }
  return 0.5 * Math.log(2 * Math.PI) + (xm1 + 0.5) * Math.log(t) - t + Math.log(a);
}

// 정규화된 불완전 베타함수 I_x(a, b) — 연분수 전개(Numerical Recipes 알고리즘)
function betacf(x: number, a: number, b: number): number {
  const MAXIT = 200;
  const EPS = 3e-9;
  const FPMIN = 1e-30;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;

    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;

    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

function regularizedIncompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  const bt = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x)
  );

  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(x, a, b)) / a;
  }
  return 1 - (bt * betacf(1 - x, b, a)) / b;
}

function tTestPValue(t: number, df: number): number {
  if (!Number.isFinite(t) || !Number.isFinite(df) || df <= 0) return 1;
  const x = df / (df + t * t);
  return regularizedIncompleteBeta(x, df / 2, 0.5);
}

function fTestPValue(f: number, df1: number, df2: number): number {
  if (!Number.isFinite(f) || f <= 0 || df1 <= 0 || df2 <= 0) return 1;
  const x = df2 / (df2 + df1 * f);
  return regularizedIncompleteBeta(x, df2 / 2, df1 / 2);
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function variance(values: number[], groupMean: number): number {
  if (values.length < 2) return 0;
  return values.reduce((sum, v) => sum + (v - groupMean) ** 2, 0) / (values.length - 1);
}

function welchTTest(a: number[], b: number[]): { statistic: number; pValue: number } {
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
  return { statistic: t, pValue };
}

function oneWayAnova(groups: number[][]): { statistic: number; pValue: number; dfWithin: number } {
  const allValues = groups.flat();
  const grandMean = mean(allValues);

  let ssBetween = 0;
  let ssWithin = 0;
  for (const group of groups) {
    const groupMean = mean(group);
    ssBetween += group.length * (groupMean - grandMean) ** 2;
    ssWithin += group.reduce((sum, v) => sum + (v - groupMean) ** 2, 0);
  }

  const dfBetween = groups.length - 1;
  const dfWithin = allValues.length - groups.length;
  if (dfWithin <= 0) return { statistic: 0, pValue: 1, dfWithin };

  const msBetween = ssBetween / dfBetween;
  const msWithin = ssWithin / dfWithin;
  const f = msWithin === 0 ? 0 : msBetween / msWithin;
  const pValue = fTestPValue(f, dfBetween, dfWithin);

  return { statistic: f, pValue, dfWithin };
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
        const { statistic, pValue } = welchTTest(a, b);
        results.push({
          groupColumn: groupColumn.name,
          numericColumn: numericColumn.name,
          method: "welch-t",
          groupCount: 2,
          statistic: Number(statistic.toFixed(3)),
          pValue: Number(pValue.toFixed(4)),
          significant: pValue < SIGNIFICANCE_LEVEL,
          groupMeans,
        });
      } else {
        const groups = validGroups.map(([, values]) => values);
        const { statistic, pValue } = oneWayAnova(groups);
        results.push({
          groupColumn: groupColumn.name,
          numericColumn: numericColumn.name,
          method: "anova-f",
          groupCount: validGroups.length,
          statistic: Number(statistic.toFixed(3)),
          pValue: Number(pValue.toFixed(4)),
          significant: pValue < SIGNIFICANCE_LEVEL,
          groupMeans,
        });
      }
    }
  }

  return results;
}
