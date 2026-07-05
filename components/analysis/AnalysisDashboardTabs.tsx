"use client";

// 분석 대시보드 탭 전환 컨트롤러: 차트/데이터 품질/지도/AI 설명 패널을 직접 분기해서 그린다
import { useEffect, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { BarChart3 } from "lucide-react";
import { TabList, Tab, Grid, Card, Text, Badge, EmptyState, SegmentedControl, SegmentedControlItem } from "@astryxdesign/core";
import type {
  CategoricalColumnStats,
  ColumnDataType,
  CorrelationPair,
  GroupComparisonResult,
  NumericColumnStats,
  OutlierColumnInfo,
  ProjectRecord,
  TimeSeriesAnalysis,
} from "@/types/analysis";
import { ChartRenderer } from "@/components/render/ChartRenderer";
import { AnalysisMapClient } from "@/components/render/AnalysisMapClient";
import { SimpleDataTable } from "@/components/render/SimpleDataTable";
import { AiNarratorPanel } from "@/components/analysis/AiNarratorPanel";
import {
  availableColumnTypes,
  buildColumnOverview,
  filterColumnsByType,
  type ColumnOverviewRow,
  type ColumnTypeFilter,
} from "@/lib/dashboard/columnFilter";

const TAB_VALUES = ["charts", "quality", "insights", "map", "ai"] as const;
type TabValue = (typeof TAB_VALUES)[number];

function readTabFromLocation(): TabValue {
  if (typeof window === "undefined") return "charts";
  const value = new URLSearchParams(window.location.search).get("tab");
  return (TAB_VALUES as readonly string[]).includes(value ?? "") ? (value as TabValue) : "charts";
}

const COLUMN_TYPE_LABEL: Record<ColumnDataType, string> = {
  numeric: "수치형",
  categorical: "범주형",
  date: "날짜형",
  boolean: "불리언",
  text: "텍스트",
};

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

const CORRELATION_COLUMNS: ColumnDef<CorrelationPair>[] = [
  { accessorKey: "columnA", header: "변수 A" },
  { accessorKey: "columnB", header: "변수 B" },
  {
    accessorKey: "coefficient",
    header: "상관계수",
    cell: (info) => (info.getValue() as number).toFixed(3),
  },
  { accessorKey: "strength", header: "강도" },
];

const OUTLIER_COLUMNS: ColumnDef<OutlierColumnInfo>[] = [
  { accessorKey: "column", header: "변수명" },
  {
    accessorKey: "lowerBound",
    header: "하한",
    cell: (info) => (info.getValue() as number).toFixed(2),
  },
  {
    accessorKey: "upperBound",
    header: "상한",
    cell: (info) => (info.getValue() as number).toFixed(2),
  },
  { accessorKey: "outlierCount", header: "이상치 수" },
];

const GROUP_COMPARISON_COLUMNS: ColumnDef<GroupComparisonResult>[] = [
  { accessorKey: "groupColumn", header: "그룹 변수" },
  { accessorKey: "numericColumn", header: "수치 변수" },
  {
    accessorKey: "method",
    header: "검정 방법",
    cell: (info) => (info.getValue() === "welch-t" ? "Welch t-검정" : "일원배치 분산분석"),
  },
  {
    accessorKey: "statistic",
    header: "통계량",
    cell: (info) => (info.getValue() as number).toFixed(3),
  },
  {
    accessorKey: "pValue",
    header: "p-value",
    cell: (info) => (info.getValue() as number).toFixed(4),
  },
  {
    accessorKey: "significant",
    header: "유의성",
    cell: (info) => (
      <Badge variant={info.getValue() ? "success" : "neutral"} label={info.getValue() ? "유의함" : "유의하지 않음"} />
    ),
  },
];

const TIME_SERIES_COLUMNS: ColumnDef<TimeSeriesAnalysis>[] = [
  { accessorKey: "dateColumn", header: "날짜 변수" },
  { accessorKey: "numericColumn", header: "수치 변수" },
  {
    accessorKey: "trendSlope",
    header: "추세 기울기",
    cell: (info) => (info.getValue() as number).toFixed(3),
  },
  { accessorKey: "trendDirection", header: "추세 방향" },
];

const COLUMN_OVERVIEW_COLUMNS: ColumnDef<ColumnOverviewRow>[] = [
  { accessorKey: "name", header: "변수명" },
  {
    accessorKey: "type",
    header: "유형",
    cell: (info) => <Badge variant="neutral" label={COLUMN_TYPE_LABEL[info.getValue() as ColumnDataType]} />,
  },
  {
    accessorKey: "missingRate",
    header: "결측률",
    cell: (info) => `${((info.getValue() as number) * 100).toFixed(1)}%`,
  },
  { accessorKey: "sampleValues", header: "예시 값" },
];

export function AnalysisDashboardTabs({ project }: { project: ProjectRecord }) {
  const [tab, setTab] = useState<TabValue>("charts");
  const [columnTypeFilter, setColumnTypeFilter] = useState<ColumnTypeFilter>("all");
  const { analysis } = project;

  // 새로고침 후에도 같은 탭을 유지: 마운트 시점에 URL 쿼리(?tab=)를 읽어 동기화한다
  // (SSR과의 하이드레이션 불일치를 피하기 위해 초기 state는 항상 "charts"로 두고 마운트 후에만 반영한다)
  useEffect(() => {
    const fromUrl = readTabFromLocation();
    setTab((current) => (current === fromUrl ? current : fromUrl));
  }, []);

  function handleTabChange(next: string) {
    setTab(next as TabValue);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", next);
      window.history.replaceState(null, "", url.toString());
    }
  }

  const columnOverview = useMemo(
    () => buildColumnOverview(analysis.schemaSummary, analysis.missingSummary),
    [analysis.schemaSummary, analysis.missingSummary]
  );
  const availableTypes = useMemo(() => availableColumnTypes(columnOverview), [columnOverview]);
  const filteredColumns = useMemo(
    () => filterColumnsByType(columnOverview, columnTypeFilter),
    [columnOverview, columnTypeFilter]
  );

  return (
    <div>
      {/* 375px 등 좁은 화면에서 탭 5개가 잘리지 않도록 가로 스크롤 허용 */}
      <div style={{ overflowX: "auto" }}>
        <TabList value={tab} onChange={handleTabChange} hasDivider>
          <Tab value="charts" label="차트" />
          <Tab value="quality" label="데이터 품질" />
          <Tab value="insights" label="심화 분석" />
          <Tab value="map" label="지도" />
          <Tab value="ai" label="AI 설명" />
        </TabList>
      </div>

      <div style={{ paddingTop: 16 }}>
        {tab === "charts" ? (
          analysis.chartSpecs.length === 0 ? (
            <EmptyState
              title="추천할 차트가 없습니다"
              description="현재 데이터에서는 자동으로 추천할 차트를 찾지 못했습니다. 다른 데이터를 업로드하거나 데이터 품질 탭에서 변수 구성을 확인해 보세요."
              icon={<BarChart3 size={32} />}
            />
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
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <Text type="label">컬럼 개요</Text>
                {availableTypes.length > 1 ? (
                  <SegmentedControl value={columnTypeFilter} onChange={(value) => setColumnTypeFilter(value as ColumnTypeFilter)} label="컬럼 유형 필터">
                    <SegmentedControlItem value="all" label="전체" />
                    {availableTypes.map((type) => (
                      <SegmentedControlItem key={type} value={type} label={COLUMN_TYPE_LABEL[type]} />
                    ))}
                  </SegmentedControl>
                ) : null}
              </div>
              {filteredColumns.length > 0 ? (
                <SimpleDataTable columns={COLUMN_OVERVIEW_COLUMNS} data={filteredColumns} />
              ) : (
                <Text color="secondary">선택한 유형의 컬럼이 없습니다.</Text>
              )}
            </div>

            {columnTypeFilter === "all" || columnTypeFilter === "numeric" ? (
              <div>
                <Text type="label">수치형 변수 통계</Text>
                {analysis.numericSummary.length > 0 ? (
                  <SimpleDataTable columns={NUMERIC_COLUMNS} data={analysis.numericSummary} />
                ) : (
                  <Text color="secondary">수치형 변수가 없습니다.</Text>
                )}
              </div>
            ) : null}

            {columnTypeFilter === "all" || columnTypeFilter === "categorical" ? (
              <div>
                <Text type="label">범주형 변수 통계</Text>
                {analysis.categoricalSummary.length > 0 ? (
                  <SimpleDataTable columns={CATEGORICAL_COLUMNS} data={analysis.categoricalSummary} />
                ) : (
                  <Text color="secondary">범주형 변수가 없습니다.</Text>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {tab === "insights" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <Text type="label">상관관계 분석</Text>
              {analysis.correlationSummary && analysis.correlationSummary.length > 0 ? (
                <SimpleDataTable columns={CORRELATION_COLUMNS} data={analysis.correlationSummary} />
              ) : (
                <Text color="secondary">상관관계를 계산할 수치형 변수 쌍이 없습니다.</Text>
              )}
            </div>

            <div>
              <Text type="label">이상치 탐지</Text>
              {analysis.outlierSummary && analysis.outlierSummary.length > 0 ? (
                <SimpleDataTable columns={OUTLIER_COLUMNS} data={analysis.outlierSummary} />
              ) : (
                <Text color="secondary">이상치를 탐지할 수치형 변수가 없습니다.</Text>
              )}
            </div>

            <div>
              <Text type="label">그룹간 차이검정</Text>
              {analysis.groupComparisonSummary && analysis.groupComparisonSummary.length > 0 ? (
                <SimpleDataTable columns={GROUP_COMPARISON_COLUMNS} data={analysis.groupComparisonSummary} />
              ) : (
                <Text color="secondary">그룹간 비교가 가능한 변수 조합이 없습니다.</Text>
              )}
            </div>

            <div>
              <Text type="label">시계열 분석</Text>
              {analysis.timeSeriesSummary && analysis.timeSeriesSummary.length > 0 ? (
                <SimpleDataTable columns={TIME_SERIES_COLUMNS} data={analysis.timeSeriesSummary} />
              ) : (
                <Text color="secondary">시계열로 분석할 날짜 변수가 없습니다.</Text>
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
