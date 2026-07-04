// 리포트 본문을 규칙 기반으로 생성한다. AI를 전혀 거치지 않는 순수 엔진 산출물이다
import type { AnalysisResult, ProjectMeta } from "@/types/analysis";

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

  lines.push("## 규칙 기반 종합 인사이트");
  lines.push(analysis.insightSummary);

  return lines.join("\n");
}
