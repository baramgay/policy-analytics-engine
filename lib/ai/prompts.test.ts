import { describe, expect, it } from "vitest";
import { buildNarratorUserPrompt } from "@/lib/ai/prompts";
import type { NarratorInput } from "@/types/analysis";

function buildBaseInput(): NarratorInput {
  return {
    projectTitle: "테스트 프로젝트",
    dataType: "카드매출",
    analysisGoal: "지역별 매출 추이 파악",
    qualityScore: 92,
    schemaSummary: {
      rowCount: 100,
      columnCount: 2,
      columns: [
        { name: "금액", type: "numeric", sampleValues: [1000, 2000] },
        { name: "지역", type: "categorical", sampleValues: ["창원시", "김해시"] },
      ],
    },
    missingSummary: {
      totalCells: 200,
      totalMissingCells: 0,
      overallMissingRate: 0,
      duplicateRowCount: 0,
      columns: [],
    },
    numericSummary: [
      { column: "금액", count: 100, mean: 1500, std: 200, min: 1000, max: 2000, median: 1500, q1: 1200, q3: 1800 },
    ],
    categoricalSummary: [{ column: "지역", uniqueCount: 2, topValues: [{ value: "창원시", count: 60, ratio: 0.6 }] }],
    ruleBasedInsight: "규칙 기반 인사이트 본문입니다.",
  };
}

describe("buildNarratorUserPrompt", () => {
  it("includes p-value formatting when correlationSummary is provided", () => {
    const input: NarratorInput = {
      ...buildBaseInput(),
      correlationSummary: [
        {
          columnA: "금액",
          columnB: "방문자수",
          coefficient: 0.35,
          strength: "보통",
          pValue: 0.0021,
          significant: true,
          interpretation: "양의 상관관계",
        },
      ],
    };

    const prompt = buildNarratorUserPrompt(input);

    expect(prompt).toContain("## 상관 검정 결과");
    expect(prompt).toContain("p=0.0021");
  });

  it("includes effect size when groupComparisonSummary is provided", () => {
    const input: NarratorInput = {
      ...buildBaseInput(),
      groupComparisonSummary: [
        {
          groupColumn: "지역",
          numericColumn: "금액",
          method: "welch-t",
          groupCount: 2,
          statistic: 2.5,
          pValue: 0.02,
          significant: true,
          groupMeans: [
            { group: "창원시", mean: 1600, count: 60, sd: 180 },
            { group: "김해시", mean: 1300, count: 40, sd: 210 },
          ],
          effectSize: { type: "cohen_d", value: 0.45, magnitude: "중간" },
          interpretation: "창원시와 김해시 간 금액 평균에 유의한 차이가 있습니다.",
        },
      ],
    };

    const prompt = buildNarratorUserPrompt(input);

    expect(prompt).toContain("## 그룹 차이 검정 결과");
    expect(prompt).toContain("효과크기");
    expect(prompt).toContain("d=0.45");
  });

  it("includes concerning VIF entries when vifSummary is provided", () => {
    const input: NarratorInput = {
      ...buildBaseInput(),
      vifSummary: [
        { column: "금액", vif: 12.3, concern: true },
        { column: "방문자수", vif: 2.1, concern: false },
      ],
    };

    const prompt = buildNarratorUserPrompt(input);

    expect(prompt).toContain("## 다중공선성 경고");
    expect(prompt).toContain("금액: VIF 12.3 (10 초과)");
    expect(prompt).not.toContain("방문자수: VIF");
  });

  it("includes mom/yoy change rates when timeSeriesSummary is provided", () => {
    const input: NarratorInput = {
      ...buildBaseInput(),
      timeSeriesSummary: [
        { dateColumn: "일자", numericColumn: "금액", trendDirection: "증가", momChange: 5.2, yoyChange: null },
      ],
    };

    const prompt = buildNarratorUserPrompt(input);

    expect(prompt).toContain("## 시계열 변화율");
    expect(prompt).toContain("전월대비");
    expect(prompt).toContain("산출 불가");
  });

  it("omits all conditional sections when no optional fields are provided", () => {
    const prompt = buildNarratorUserPrompt(buildBaseInput());

    expect(prompt).not.toContain("## 상관 검정 결과");
    expect(prompt).not.toContain("## 그룹 차이 검정 결과");
    expect(prompt).not.toContain("## 다중공선성 경고");
    expect(prompt).not.toContain("## 시계열 변화율");
  });
});
