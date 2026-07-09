// 리포트 본문을 규칙 기반으로 생성한다. AI를 전혀 거치지 않는 순수 엔진 산출물이다
import type { AnalysisResult, ProjectMeta } from "@/types/analysis";

function formatChangeRate(value: number | null): string {
  if (value === null) return "산출 불가";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function buildCorrelationSection(analysis: AnalysisResult): string[] {
  const significantPairs = (analysis.correlationSummary ?? []).filter((pair) => pair.significant);
  if (significantPairs.length === 0) return [];

  const lines: string[] = ["## 상관 검정"];
  for (const pair of significantPairs) {
    lines.push(`- ${pair.columnA} - ${pair.columnB}: ${pair.interpretation}`);
  }
  lines.push("");
  return lines;
}

function buildCategoricalCorrelationSection(analysis: AnalysisResult): string[] {
  const targetPairs = (analysis.categoricalCorrelationSummary ?? []).filter(
    (pair) => pair.significant || !pair.reliable
  );
  if (targetPairs.length === 0) return [];

  const lines: string[] = ["## 범주형 변수 연관성"];
  for (const pair of targetPairs) {
    lines.push(`- ${pair.columnA} - ${pair.columnB}: ${pair.interpretation}`);
  }
  lines.push("");
  return lines;
}

function buildVifSection(analysis: AnalysisResult): string[] {
  const concerns = (analysis.vifSummary ?? []).filter((item) => item.concern);
  if (concerns.length === 0) return [];

  const lines: string[] = ["## 다중공선성 진단"];
  for (const item of concerns) {
    lines.push(`- ${item.column}: VIF ${item.vif !== null ? item.vif.toFixed(1) : "산출 불가"} (10 초과)`);
  }
  lines.push("회귀 분석 시 해당 변수들의 동시 투입에 주의가 필요합니다.");
  lines.push("");
  return lines;
}

function buildGroupComparisonSection(analysis: AnalysisResult): string[] {
  const results = analysis.groupComparisonSummary ?? [];
  if (results.length === 0) return [];

  const lines: string[] = ["## 그룹 차이 검정"];
  for (const result of results) {
    lines.push(`- ${result.groupColumn} - ${result.numericColumn}: ${result.interpretation}`);
  }
  lines.push("");
  return lines;
}

function buildOutlierSection(analysis: AnalysisResult): string[] {
  const columns = (analysis.outlierSummary ?? []).filter((item) => item.outlierCount > 0);
  if (columns.length === 0) return [];

  const lines: string[] = ["## 이상치 탐지"];
  for (const item of columns) {
    lines.push(
      `- **${item.column}**: 고신뢰 이상치 ${item.highConfidenceIndices.length}건, 참고 수준 ${item.referenceIndices.length}건 (정상 범위 ${item.lowerBound} ~ ${item.upperBound})`
    );
  }
  lines.push("");
  return lines;
}

function buildTimeSeriesSection(analysis: AnalysisResult): string[] {
  const series = analysis.timeSeriesSummary ?? [];
  if (series.length === 0) return [];

  const lines: string[] = ["## 시계열 동향"];
  for (const item of series) {
    lines.push(
      `- ${item.dateColumn} - ${item.numericColumn}: 추세 ${item.trendDirection}, 전월대비 ${formatChangeRate(item.momChange)}, 전년동월대비 ${formatChangeRate(item.yoyChange)}`
    );
  }
  lines.push("");
  return lines;
}

export function buildReportMarkdown(meta: ProjectMeta, analysis: AnalysisResult): string {
  const lines: string[] = [];

  lines.push(`# ${meta.title}`);
  lines.push("");
  lines.push(`- 데이터 유형: ${meta.dataType}`);
  lines.push(`- 분석 목적: ${meta.analysisGoal}`);
  lines.push(`- 데이터 품질 점수: ${analysis.qualityScore}점`);
  lines.push("");
  lines.push("## 데이터 개요");
  lines.push(
    `전체 ${analysis.schemaSummary.rowCount.toLocaleString()}행, ${analysis.schemaSummary.columnCount}개 변수로 구성되어 있으며, ` +
      `전체 결측률은 ${(analysis.missingSummary.overallMissingRate * 100).toFixed(1)}%, 중복 행은 ${analysis.missingSummary.duplicateRowCount.toLocaleString()}건입니다.`
  );
  lines.push("");

  if (analysis.numericSummary.length > 0) {
    lines.push("## 수치형 변수 통계");
    for (const stat of analysis.numericSummary) {
      lines.push(
        `- **${stat.column}**: 평균 ${stat.mean.toFixed(2)}, 표준편차 ${stat.std.toFixed(2)}, 최소 ${stat.min}, 최대 ${stat.max}, 중앙값 ${stat.median}`
      );
    }
    lines.push("");
  }

  if (analysis.categoricalSummary.length > 0) {
    lines.push("## 범주형 변수 통계");
    for (const stat of analysis.categoricalSummary) {
      const top = stat.topValues
        .slice(0, 3)
        .map((item) => `${item.value}(${(item.ratio * 100).toFixed(0)}%)`)
        .join(", ");
      lines.push(`- **${stat.column}**: 고유값 ${stat.uniqueCount}개, 상위 값 ${top}`);
    }
    lines.push("");
  }

  lines.push(...buildCorrelationSection(analysis));
  lines.push(...buildCategoricalCorrelationSection(analysis));
  lines.push(...buildVifSection(analysis));
  lines.push(...buildGroupComparisonSection(analysis));
  lines.push(...buildOutlierSection(analysis));
  lines.push(...buildTimeSeriesSection(analysis));

  lines.push("## 규칙 기반 종합 인사이트");
  lines.push(analysis.insightSummary);

  return lines.join("\n");
}
