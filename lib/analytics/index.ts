// 분석 엔진 진입점: 파싱된 데이터셋을 받아 AnalysisResult 전체를 계산한다 (클라이언트 사이드 전용, AI 미사용)
import type { AnalysisResult, ParsedDataset } from "@/types/analysis";
import { profileSchema } from "./schemaProfiler";
import { checkQuality, computeQualityScore } from "./qualityChecker";
import { generateNumericSummary, generateCategoricalSummary } from "./statsGenerator";
import { recommendCharts } from "./chartRecommender";
import { detectMap } from "./mapDetector";
import { generateInsight } from "./insightGenerator";
import {
  generateCorrelationSummary,
  generateCategoricalCorrelationSummary,
  computeVif,
} from "./correlationAnalyzer";
import { detectOutliers } from "./outlierDetector";
import { generateGroupComparisonSummary } from "./groupComparator";
import { generateTimeSeriesSummary } from "./dateDetector";

export function runAnalysis(dataset: ParsedDataset): AnalysisResult {
  const schemaSummary = profileSchema(dataset);
  const missingSummary = checkQuality(dataset, schemaSummary);
  const numericSummary = generateNumericSummary(dataset, schemaSummary);
  const categoricalSummary = generateCategoricalSummary(dataset, schemaSummary);
  const correlationSummary = generateCorrelationSummary(dataset, schemaSummary);
  const categoricalCorrelationSummary = generateCategoricalCorrelationSummary(dataset, schemaSummary);
  const vifSummary = computeVif(dataset, schemaSummary);
  const outlierSummary = detectOutliers(dataset, schemaSummary);
  const groupComparisonSummary = generateGroupComparisonSummary(dataset, schemaSummary);
  const timeSeriesSummary = generateTimeSeriesSummary(dataset, schemaSummary);
  const chartSpecs = recommendCharts(
    dataset,
    schemaSummary,
    numericSummary,
    categoricalSummary,
    groupComparisonSummary
  );
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
    correlationSummary,
    categoricalCorrelationSummary,
    vifSummary,
    outlierSummary,
    groupComparisonSummary,
    timeSeriesSummary,
  };
}

export * from "./parser";
