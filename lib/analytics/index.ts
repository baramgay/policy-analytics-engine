// 분석 엔진 진입점: 파싱된 데이터셋을 받아 AnalysisResult 전체를 계산한다 (클라이언트 사이드 전용, AI 미사용)
import type { AnalysisResult, ParsedDataset } from "@/types/analysis";
import { profileSchema } from "./schemaProfiler";
import { checkQuality, computeQualityScore } from "./qualityChecker";
import { generateNumericSummary, generateCategoricalSummary } from "./statsGenerator";
import { recommendCharts } from "./chartRecommender";
import { detectMap } from "./mapDetector";
import { generateInsight } from "./insightGenerator";

export function runAnalysis(dataset: ParsedDataset): AnalysisResult {
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

  return {
    qualityScore,
    schemaSummary,
    missingSummary,
    numericSummary,
    categoricalSummary,
    chartSpecs,
    mapSpecs,
    insightSummary,
    generatedAt: new Date().toISOString(),
  };
}

export * from "./parser";
