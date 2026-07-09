"use client";

// AI 접점 UI: 규칙 기반 분석 엔진이 계산한 요약(NarratorInput)만 /api/narrate로 보내고, 원본 행 데이터는 절대 전송하지 않는다
import { useState } from "react";
import { Button, Banner, Skeleton, Markdown, Text } from "@astryxdesign/core";
import type { NarratorInput, NarratorTimeSeries, ProjectRecord } from "@/types/analysis";

function buildNarratorInput(project: ProjectRecord): NarratorInput {
  const { analysis } = project;
  const timeSeriesSummary: NarratorTimeSeries[] | undefined = analysis.timeSeriesSummary?.map((item) => ({
    dateColumn: item.dateColumn,
    numericColumn: item.numericColumn,
    trendDirection: item.trendDirection,
    momChange: item.momChange,
    yoyChange: item.yoyChange,
  }));

  return {
    projectTitle: project.meta.title,
    dataType: project.meta.dataType,
    analysisGoal: project.meta.analysisGoal,
    qualityScore: analysis.qualityScore,
    schemaSummary: analysis.schemaSummary,
    missingSummary: analysis.missingSummary,
    numericSummary: analysis.numericSummary,
    categoricalSummary: analysis.categoricalSummary,
    ruleBasedInsight: analysis.insightSummary,
    correlationSummary: analysis.correlationSummary,
    categoricalCorrelationSummary: analysis.categoricalCorrelationSummary,
    vifSummary: analysis.vifSummary,
    groupComparisonSummary: analysis.groupComparisonSummary,
    timeSeriesSummary,
  };
}

export function AiNarratorPanel({ project }: { project: ProjectRecord }) {
  const [narrative, setNarrative] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleGenerate() {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildNarratorInput(project)),
      });
      if (!response.ok) throw new Error("AI 설명 생성에 실패했습니다");
      const data = (await response.json()) as { narrative: string };
      setNarrative(data.narrative);
    } catch {
      setErrorMessage("AI 설명 기능은 아직 준비 중입니다. 규칙 기반 분석 결과는 정상적으로 확인할 수 있습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Banner
        status="info"
        title="AI는 원본 데이터를 보지 않습니다"
        description="분석 엔진이 계산한 요약 통계(스키마·결측률·수치/범주 통계)만 AI에 전달되어 설명 문장으로 다듬어집니다. 실제 데이터 행은 어떤 경우에도 AI로 전송되지 않습니다."
      />

      {narrative === null ? (
        <Button label="AI 설명 생성하기" variant="primary" isLoading={isLoading} clickAction={handleGenerate} />
      ) : null}

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton height={16} />
          <Skeleton height={16} index={1} />
          <Skeleton height={16} index={2} />
        </div>
      ) : null}

      {errorMessage ? <Banner status="warning" title="알림" description={errorMessage} /> : null}

      {narrative ? (
        <div>
          <Markdown>{narrative}</Markdown>
          <Text type="supporting" color="secondary">
            위 설명은 규칙 기반 분석 결과를 문장으로 정리한 것이며, 새로운 수치를 계산하지 않습니다.
          </Text>
        </div>
      ) : null}
    </div>
  );
}
