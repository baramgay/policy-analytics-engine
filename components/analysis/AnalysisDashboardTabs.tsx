"use client";

// 분석 대시보드 탭 전환 컨트롤러: 차트/데이터 품질/지도/AI 설명 패널을 직접 분기해서 그린다
import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { TabList, Tab, Grid, Card, Text } from "@astryxdesign/core";
import type { CategoricalColumnStats, NumericColumnStats, ProjectRecord } from "@/types/analysis";
import { ChartRenderer } from "@/components/render/ChartRenderer";
import { AnalysisMapClient } from "@/components/render/AnalysisMapClient";
import { SimpleDataTable } from "@/components/render/SimpleDataTable";
import { AiNarratorPanel } from "@/components/analysis/AiNarratorPanel";

const NUMERIC_COLUMNS: ColumnDef<NumericColumnStats>[] = [
  { accessorKey: "column", header: "변수명" },
  { accessorKey: "count", header: "표본 수" },
  { accessorKey: "mean", header: "평균", cell: (info) => (info.getValue() as number).toFixed(2) },
  { accessorKey: "std", header: "표준편차", cell: (info) => (info.getValue() as number).toFixed(2) },
  { accessorKey: "min", header: "최소" },
  { accessorKey: "median", header: "중앙값" },
  { accessorKey: "max", header: "최대" },
];

const CATEGORICAL_COLUMNS: ColumnDef<CategoricalColumnStats>[] = [
  { accessorKey: "column", header: "변수명" },
  { accessorKey: "uniqueCount", header: "고유값 수" },
  {
    id: "topValues",
    header: "상위 값",
    cell: (info) =>
      info.row.original.topValues
        .slice(0, 3)
        .map((item) => `${item.value}(${(item.ratio * 100).toFixed(0)}%)`)
        .join(", "),
  },
];

export function AnalysisDashboardTabs({ project }: { project: ProjectRecord }) {
  const [tab, setTab] = useState("charts");
  const { analysis } = project;

  return (
    <div>
      <TabList value={tab} onChange={setTab} hasDivider>
        <Tab value="charts" label="차트" />
        <Tab value="quality" label="데이터 품질" />
        <Tab value="map" label="지도" />
        <Tab value="ai" label="AI 설명" />
      </TabList>

      <div style={{ paddingTop: 16 }}>
        {tab === "charts" ? (
          analysis.chartSpecs.length === 0 ? (
            <Text color="secondary">추천할 차트가 없습니다.</Text>
          ) : (
            <Grid columns={{ minWidth: 360, max: 2 }} gap={4}>
              {analysis.chartSpecs.map((spec) => (
                <Card key={spec.id}>
                  <Text type="label">{spec.title}</Text>
                  <ChartRenderer spec={spec} />
                </Card>
              ))}
            </Grid>
          )
        ) : null}

        {tab === "quality" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <Text type="label">수치형 변수 통계</Text>
              {analysis.numericSummary.length > 0 ? (
                <SimpleDataTable columns={NUMERIC_COLUMNS} data={analysis.numericSummary} />
              ) : (
                <Text color="secondary">수치형 변수가 없습니다.</Text>
              )}
            </div>
            <div>
              <Text type="label">범주형 변수 통계</Text>
              {analysis.categoricalSummary.length > 0 ? (
                <SimpleDataTable columns={CATEGORICAL_COLUMNS} data={analysis.categoricalSummary} />
              ) : (
                <Text color="secondary">범주형 변수가 없습니다.</Text>
              )}
            </div>
          </div>
        ) : null}

        {tab === "map" ? <AnalysisMapClient spec={analysis.mapSpecs} /> : null}

        {tab === "ai" ? <AiNarratorPanel project={project} /> : null}
      </div>
    </div>
  );
}
