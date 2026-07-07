// 수치형 컬럼 쌍별 Pearson 상관계수를 직접 계산한다 (외부 통계 라이브러리 미사용)
import type {
  CategoricalCorrelationPair,
  CorrelationPair,
  ParsedDataset,
  SchemaSummary,
} from "@/types/analysis";
import { tTestPValue, chiSquarePValue } from "./statUtils";

const SIGNIFICANCE_LEVEL = 0.05;

function pearsonCoefficient(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;

  const meanX = x.reduce((sum, v) => sum + v, 0) / n;
  const meanY = y.reduce((sum, v) => sum + v, 0) / n;

  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    sumSqX += dx * dx;
    sumSqY += dy * dy;
  }

  const denominator = Math.sqrt(sumSqX * sumSqY);
  return denominator === 0 ? 0 : numerator / denominator;
}

function classifyStrength(coefficient: number): CorrelationPair["strength"] {
  const abs = Math.abs(coefficient);
  if (abs >= 0.7) return "매우 강함";
  if (abs >= 0.5) return "강함";
  if (abs >= 0.3) return "보통";
  if (abs >= 0.1) return "약함";
  return "거의 없음";
}

export function generateCorrelationSummary(
  dataset: ParsedDataset,
  schema: SchemaSummary
): CorrelationPair[] {
  const numericColumns = schema.columns.filter((c) => c.type === "numeric");
  const pairs: CorrelationPair[] = [];

  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      const columnA = numericColumns[i].name;
      const columnB = numericColumns[j].name;

      const xs: number[] = [];
      const ys: number[] = [];
      for (const row of dataset.rows) {
        const a = row[columnA];
        const b = row[columnB];
        if (typeof a === "number" && typeof b === "number") {
          xs.push(a);
          ys.push(b);
        }
      }
      if (xs.length < 2) continue;

      const coefficient = Number(pearsonCoefficient(xs, ys).toFixed(3));
      const df = xs.length - 2;
      let rawPValue = 1;
      if (Math.abs(coefficient) >= 1) {
        rawPValue = 0;
      } else if (df > 0) {
        const t = Math.abs(coefficient) * Math.sqrt(df / (1 - coefficient * coefficient));
        rawPValue = tTestPValue(t, df);
      }
      const pValue = Number(rawPValue.toFixed(4));
      const significant = pValue < SIGNIFICANCE_LEVEL;
      const strength = classifyStrength(coefficient);
      const pText = pValue < 0.001 ? "p<0.001" : `p=${pValue.toFixed(4)}`;
      pairs.push({
        columnA,
        columnB,
        coefficient,
        strength,
        pValue,
        significant,
        interpretation: significant
          ? `상관계수 ${coefficient}, ${pText}로 통계적으로 유의한 ${strength} ${coefficient >= 0 ? "양" : "음"}의 상관관계`
          : `상관계수 ${coefficient}, ${pText}로 통계적으로 유의하지 않음`,
      });
    }
  }

  return pairs.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
}

export function generateCategoricalCorrelationSummary(
  dataset: ParsedDataset,
  schema: SchemaSummary
): CategoricalCorrelationPair[] {
  const categoricalColumns = schema.columns.filter(
    (c) => c.type === "categorical" || c.type === "boolean"
  );
  const pairs: CategoricalCorrelationPair[] = [];

  for (let i = 0; i < categoricalColumns.length; i++) {
    for (let j = i + 1; j < categoricalColumns.length; j++) {
      const columnA = categoricalColumns[i].name;
      const columnB = categoricalColumns[j].name;

      const rowLabels = new Set<string>();
      const colLabels = new Set<string>();
      const pairCounts = new Map<string, number>();
      let total = 0;

      for (const row of dataset.rows) {
        const a = row[columnA];
        const b = row[columnB];
        if (a === null || b === null) continue;
        const rowLabel = String(a);
        const colLabel = String(b);
        rowLabels.add(rowLabel);
        colLabels.add(colLabel);
        const key = `${rowLabel} ${colLabel}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
        total += 1;
      }

      if (total === 0 || rowLabels.size < 2 || colLabels.size < 2) continue;

      const rows = Array.from(rowLabels);
      const cols = Array.from(colLabels);
      const rowTotals = new Map<string, number>();
      const colTotals = new Map<string, number>();
      for (const rowLabel of rows) {
        let sum = 0;
        for (const colLabel of cols) {
          sum += pairCounts.get(`${rowLabel} ${colLabel}`) ?? 0;
        }
        rowTotals.set(rowLabel, sum);
      }
      for (const colLabel of cols) {
        let sum = 0;
        for (const rowLabel of rows) {
          sum += pairCounts.get(`${rowLabel} ${colLabel}`) ?? 0;
        }
        colTotals.set(colLabel, sum);
      }

      let chiSquare = 0;
      let lowExpectedCellCount = 0;
      const totalCells = rows.length * cols.length;
      for (const rowLabel of rows) {
        for (const colLabel of cols) {
          const observed = pairCounts.get(`${rowLabel} ${colLabel}`) ?? 0;
          const expected = (rowTotals.get(rowLabel)! * colTotals.get(colLabel)!) / total;
          if (expected < 5) lowExpectedCellCount += 1;
          if (expected > 0) {
            chiSquare += (observed - expected) ** 2 / expected;
          }
        }
      }

      const df = (rows.length - 1) * (cols.length - 1);
      const pValue = Number(chiSquarePValue(chiSquare, df).toFixed(4));
      const significant = pValue < SIGNIFICANCE_LEVEL;
      const minDimension = Math.min(rows.length - 1, cols.length - 1);
      const cramersV =
        minDimension === 0
          ? 0
          : Number(Math.sqrt(chiSquare / (total * minDimension)).toFixed(3));
      const reliable = lowExpectedCellCount / totalCells <= 0.2;

      pairs.push({
        columnA,
        columnB,
        chiSquare: Number(chiSquare.toFixed(3)),
        pValue,
        significant,
        cramersV,
        reliable,
        interpretation: !reliable
          ? "표본이 작아 참고용"
          : significant
            ? `카이제곱=${chiSquare.toFixed(2)}, p=${pValue}로 통계적으로 유의한 연관성(Cramér's V=${cramersV})`
            : `카이제곱=${chiSquare.toFixed(2)}, p=${pValue}로 통계적으로 유의한 연관성 없음`,
      });
    }
  }

  return pairs;
}
