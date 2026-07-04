// 계산된 통계만 근거로 한국어 인사이트 문장을 규칙 기반으로 생성한다 (AI 미사용)
import type {
  CategoricalColumnStats,
  MissingSummary,
  NumericColumnStats,
  SchemaSummary,
} from "@/types/analysis";

export function generateInsight(
  schema: SchemaSummary,
  missingSummary: MissingSummary,
  numericSummary: NumericColumnStats[],
  categoricalSummary: CategoricalColumnStats[],
  qualityScore: number
): string {
  const lines: string[] = [];

  lines.push(
    `전체 ${schema.rowCount.toLocaleString()}행, ${schema.columnCount}개 컬럼으로 구성된 데이터이며, 품질 점수는 100점 만점에 ${qualityScore}점입니다.`
  );

  if (missingSummary.overallMissingRate > 0) {
    const worst = [...missingSummary.columns].sort(
      (a, b) => b.missingRate - a.missingRate
    )[0];
    lines.push(
      `전체 셀의 ${(missingSummary.overallMissingRate * 100).toFixed(1)}%가 결측이며, "${worst.name}" 컬럼의 결측률이 ${(worst.missingRate * 100).toFixed(1)}%로 가장 높습니다.`
    );
  } else {
    lines.push("결측치는 발견되지 않았습니다.");
  }

  if (missingSummary.duplicateRowCount > 0) {
    lines.push(`중복 행이 ${missingSummary.duplicateRowCount}건 확인되어 정제가 필요합니다.`);
  }

  const primaryNumeric = numericSummary[0];
  if (primaryNumeric) {
    lines.push(
      `"${primaryNumeric.column}"의 평균은 ${primaryNumeric.mean.toLocaleString()}, 중앙값은 ${primaryNumeric.median.toLocaleString()}이며 최소 ${primaryNumeric.min.toLocaleString()}~최대 ${primaryNumeric.max.toLocaleString()} 범위를 보입니다.`
    );
  }

  const primaryCategorical = categoricalSummary[0];
  if (primaryCategorical && primaryCategorical.topValues.length > 0) {
    const top = primaryCategorical.topValues[0];
    lines.push(
      `"${primaryCategorical.column}" 기준으로는 "${top.value}"이(가) 전체의 ${(top.ratio * 100).toFixed(1)}%로 가장 큰 비중을 차지합니다.`
    );
  }

  return lines.join(" ");
}
