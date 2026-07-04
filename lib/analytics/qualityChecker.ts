// 결측치·중복행을 진단하고 이를 근거로 데이터 품질 점수(0~100)를 산출한다
import type { MissingSummary, ParsedDataset, SchemaSummary } from "@/types/analysis";

export function checkQuality(
  dataset: ParsedDataset,
  schema: SchemaSummary
): MissingSummary {
  const totalCells = dataset.rows.length * dataset.columns.length;
  let totalMissingCells = 0;

  const columns = schema.columns.map((column) => {
    const missingCount = dataset.rows.filter(
      (row) => row[column.name] === null
    ).length;
    totalMissingCells += missingCount;
    return {
      name: column.name,
      missingCount,
      missingRate: dataset.rows.length > 0 ? missingCount / dataset.rows.length : 0,
    };
  });

  const rowSignatures = new Set<string>();
  let duplicateRowCount = 0;
  for (const row of dataset.rows) {
    const signature = dataset.columns.map((c) => row[c]).join("|");
    if (rowSignatures.has(signature)) duplicateRowCount += 1;
    else rowSignatures.add(signature);
  }

  return {
    totalCells,
    totalMissingCells,
    overallMissingRate: totalCells > 0 ? totalMissingCells / totalCells : 0,
    duplicateRowCount,
    columns,
  };
}

export function computeQualityScore(
  missingSummary: MissingSummary,
  rowCount: number
): number {
  const missingPenalty = missingSummary.overallMissingRate * 60;
  const duplicateRate = rowCount > 0 ? missingSummary.duplicateRowCount / rowCount : 0;
  const duplicatePenalty = duplicateRate * 30;
  const volumePenalty = rowCount < 10 ? 20 : rowCount < 30 ? 10 : 0;

  const score = 100 - missingPenalty - duplicatePenalty - volumePenalty;
  return Math.max(0, Math.min(100, Math.round(score)));
}
