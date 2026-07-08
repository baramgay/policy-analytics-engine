// AI narrator 프롬프트 구성. 여기서 만드는 프롬프트에는 요약 통계만 들어가고,
// 원본 데이터 행은 애초에 NarratorInput 타입에 존재하지 않으므로 구조적으로 포함될 수 없다.
import type { NarratorInput } from "@/types/analysis";

export const NARRATOR_SYSTEM_PROMPT = `당신은 공공데이터 분석 리포트의 설명 문장을 다듬는 역할만 수행합니다.
아래 원칙을 반드시 지키십시오.
- 이미 계산된 요약 통계(스키마, 결측률, 수치/범주 통계, 규칙 기반 인사이트)만 근거로 설명 문장을 작성합니다.
- 새로운 수치를 추정하거나 계산하지 않습니다. 주어지지 않은 값은 언급하지 않습니다.
- 데이터 품질, 주요 변수 특징, 분석 목적과의 연관성을 공공기관 보고서 수준의 정중하고 명료한 문체로 설명합니다.
- 통계적 유의성과 효과크기를 함께 서술합니다. 표본이 커서 유의하더라도 효과크기가 작으면 "실질적 차이는 크지 않다"고 명시합니다.
- 한자와 일본어 문자는 절대 사용하지 않습니다. 순수 한글과 숫자, 필요한 경우 영문 용어만 사용합니다.
- 결과는 3~5문단 분량의 마크다운 텍스트로 작성합니다.`;

function formatChangeRate(value: number | null): string {
  if (value === null) return "산출 불가";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function buildCorrelationSection(input: NarratorInput): string[] {
  const numericPairs = input.correlationSummary ?? [];
  const categoricalPairs = input.categoricalCorrelationSummary ?? [];
  if (numericPairs.length === 0 && categoricalPairs.length === 0) return [];

  const lines: string[] = [`## 상관 검정 결과`];
  for (const pair of numericPairs) {
    lines.push(
      `- ${pair.columnA} - ${pair.columnB}: 상관계수 ${pair.coefficient.toFixed(2)}, p=${pair.pValue.toFixed(4)}, ${pair.significant ? "유의함" : "유의하지 않음"}`
    );
  }
  for (const pair of categoricalPairs) {
    lines.push(
      `- ${pair.columnA} - ${pair.columnB} (범주형): Cramer's V ${pair.cramersV.toFixed(2)}, p=${pair.pValue.toFixed(4)}, ${pair.significant ? "유의함" : "유의하지 않음"}`
    );
  }
  lines.push("");
  return lines;
}

function buildGroupComparisonSection(input: NarratorInput): string[] {
  const results = input.groupComparisonSummary ?? [];
  if (results.length === 0) return [];

  const lines: string[] = [`## 그룹 차이 검정 결과`];
  for (const result of results) {
    lines.push(`- ${result.interpretation}`);
    if (result.effectSize) {
      const label = result.effectSize.type === "cohen_d" ? "효과크기 d" : "eta 제곱";
      lines.push(`  ${label}=${result.effectSize.value.toFixed(2)} (${result.effectSize.magnitude})`);
    } else {
      lines.push(`  효과크기 산출 불가`);
    }
  }
  lines.push("");
  return lines;
}

function buildVifSection(input: NarratorInput): string[] {
  const concerns = (input.vifSummary ?? []).filter((item) => item.concern);
  if (concerns.length === 0) return [];

  const lines: string[] = [`## 다중공선성 경고`];
  for (const item of concerns) {
    lines.push(`- ${item.column}: VIF ${item.vif !== null ? item.vif.toFixed(1) : "산출 불가"} (10 초과)`);
  }
  lines.push("");
  return lines;
}

function buildTimeSeriesSection(input: NarratorInput): string[] {
  const series = input.timeSeriesSummary ?? [];
  if (series.length === 0) return [];

  const lines: string[] = [`## 시계열 변화율`];
  for (const item of series) {
    lines.push(
      `- ${item.numericColumn} (${item.dateColumn}): 추세 ${item.trendDirection}, 전월대비 ${formatChangeRate(item.momChange)}, 전년동월대비 ${formatChangeRate(item.yoyChange)}`
    );
  }
  lines.push("");
  return lines;
}

export function buildNarratorUserPrompt(input: NarratorInput): string {
  const lines: string[] = [];

  lines.push(`## 프로젝트 정보`);
  lines.push(`- 제목: ${input.projectTitle}`);
  lines.push(`- 데이터 유형: ${input.dataType}`);
  lines.push(`- 분석 목적: ${input.analysisGoal}`);
  lines.push(`- 데이터 품질 점수: ${input.qualityScore}점`);
  lines.push("");

  lines.push(`## 스키마 요약`);
  lines.push(`전체 ${input.schemaSummary.rowCount}행, ${input.schemaSummary.columnCount}개 변수`);
  for (const column of input.schemaSummary.columns) {
    lines.push(`- ${column.name} (${column.type})`);
  }
  lines.push("");

  lines.push(`## 결측치 요약`);
  lines.push(
    `전체 결측률 ${(input.missingSummary.overallMissingRate * 100).toFixed(1)}%, 중복 행 ${input.missingSummary.duplicateRowCount}건`
  );
  lines.push("");

  if (input.numericSummary.length > 0) {
    lines.push(`## 수치형 변수 통계`);
    for (const stat of input.numericSummary) {
      lines.push(
        `- ${stat.column}: 평균 ${stat.mean.toFixed(2)}, 표준편차 ${stat.std.toFixed(2)}, 최소 ${stat.min}, 최대 ${stat.max}, 중앙값 ${stat.median}`
      );
    }
    lines.push("");
  }

  if (input.categoricalSummary.length > 0) {
    lines.push(`## 범주형 변수 통계`);
    for (const stat of input.categoricalSummary) {
      const top = stat.topValues
        .slice(0, 3)
        .map((item) => `${item.value}(${(item.ratio * 100).toFixed(0)}%)`)
        .join(", ");
      lines.push(`- ${stat.column}: 고유값 ${stat.uniqueCount}개, 상위 값 ${top}`);
    }
    lines.push("");
  }

  lines.push(...buildCorrelationSection(input));
  lines.push(...buildGroupComparisonSection(input));
  lines.push(...buildVifSection(input));
  lines.push(...buildTimeSeriesSection(input));

  lines.push(`## 규칙 기반 종합 인사이트 (엔진 산출물)`);
  lines.push(input.ruleBasedInsight);
  lines.push("");
  lines.push(`위 요약 통계만 근거로, 분석 목적에 맞춘 설명 문장을 작성해주세요.`);

  return lines.join("\n");
}
