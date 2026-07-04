// 실제 lib/analytics 엔진을 sample-data CSV 4종에 대해 실행해 결과를 출력하는 검증 스크립트.
// 브라우저 없이 node로 직접 실행: npx tsx scripts/verify-engine-samples.ts
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { profileSchema } from "../lib/analytics/schemaProfiler";
import { checkQuality, computeQualityScore } from "../lib/analytics/qualityChecker";
import { generateNumericSummary, generateCategoricalSummary } from "../lib/analytics/statsGenerator";
import { recommendCharts } from "../lib/analytics/chartRecommender";
import { detectMap } from "../lib/analytics/mapDetector";
import { generateInsight } from "../lib/analytics/insightGenerator";
import type { ParsedDataset } from "../types/analysis";

function normalizeValue(value: unknown): string | number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  const asString = String(value).trim();
  if (asString === "") return null;
  const asNumber = Number(asString.replace(/,/g, ""));
  if (!Number.isNaN(asNumber) && asString.match(/^-?[\d,]+(\.\d+)?%?$/)) {
    return asNumber;
  }
  return asString;
}

function csvToDataset(filePath: string): ParsedDataset {
  const raw = fs.readFileSync(filePath, "utf-8");
  const result = Papa.parse<Record<string, unknown>>(raw, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  const rows = result.data;
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  return {
    columns,
    rows: rows.map((r) => {
      const row: Record<string, string | number | null> = {};
      for (const c of columns) row[c] = normalizeValue(r[c]);
      return row;
    }),
  };
}

function runAnalysis(dataset: ParsedDataset) {
  const schemaSummary = profileSchema(dataset);
  const missingSummary = checkQuality(dataset, schemaSummary);
  const numericSummary = generateNumericSummary(dataset, schemaSummary);
  const categoricalSummary = generateCategoricalSummary(dataset, schemaSummary);
  const chartSpecs = recommendCharts(dataset, schemaSummary, numericSummary, categoricalSummary);
  const mapSpecs = detectMap(dataset, schemaSummary);
  const qualityScore = computeQualityScore(missingSummary, schemaSummary.rowCount);
  const insightSummary = generateInsight(
    schemaSummary,
    missingSummary,
    numericSummary,
    categoricalSummary,
    qualityScore
  );
  return { qualityScore, schemaSummary, missingSummary, numericSummary, categoricalSummary, chartSpecs, mapSpecs, insightSummary };
}

const sampleDir = path.join(__dirname, "..", "sample-data");
const files = fs.readdirSync(sampleDir).filter((f) => f.endsWith(".csv"));

for (const file of files) {
  const dataset = csvToDataset(path.join(sampleDir, file));
  const result = runAnalysis(dataset);
  console.log("\n" + "=".repeat(70));
  console.log(`파일: ${file}`);
  console.log("=".repeat(70));
  console.log(`행수: ${result.schemaSummary.rowCount}, 열수: ${result.schemaSummary.columnCount}`);
  console.log(`컬럼 타입: ${result.schemaSummary.columns.map((c) => `${c.name}(${c.type})`).join(", ")}`);
  console.log(`품질점수: ${result.qualityScore}`);
  console.log(`결측 요약: 전체셀 ${result.missingSummary.totalCells}, 결측셀 ${result.missingSummary.totalMissingCells}, 결측률 ${(result.missingSummary.overallMissingRate * 100).toFixed(1)}%, 중복행 ${result.missingSummary.duplicateRowCount}`);
  for (const col of result.missingSummary.columns) {
    if (col.missingCount > 0) console.log(`  - ${col.name}: 결측 ${col.missingCount}건 (${(col.missingRate * 100).toFixed(1)}%)`);
  }
  console.log(`수치 요약: ${result.numericSummary.map((n) => `${n.column}(평균 ${n.mean.toFixed(1)}, 최소 ${n.min}, 최대 ${n.max})`).join("; ") || "(없음)"}`);
  console.log(`범주 요약: ${result.categoricalSummary.map((c) => `${c.column}(고유값 ${c.uniqueCount}개, 최다 ${c.topValues[0]?.value}=${c.topValues[0]?.count}건)`).join("; ") || "(없음)"}`);
  console.log(`차트 추천: ${result.chartSpecs.map((c) => `${c.type}:${c.title}`).join(", ") || "(없음)"}`);
  console.log(`지도 감지: mode=${result.mapSpecs.mode}, detected=${result.mapSpecs.detected}, 포인트수=${result.mapSpecs.points.length}`);
  console.log(`인사이트: ${result.insightSummary}`);
}
