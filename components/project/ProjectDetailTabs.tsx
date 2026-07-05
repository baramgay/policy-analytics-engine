"use client";

// 프로젝트 상세 화면의 탭 전환을 담당하는 클라이언트 컴포넌트 (Astryx TabList는 TabPanel이 없어 직접 분기한다)
import { useState } from "react";
import { TabList, Tab, MetadataList, MetadataListItem, List, ListItem } from "@astryxdesign/core";
import type { ProjectRecord } from "@/types/analysis";

export function ProjectDetailTabs({ project }: { project: ProjectRecord }) {
  const [tab, setTab] = useState("overview");
  const { analysis } = project;

  return (
    <div>
      <TabList value={tab} onChange={setTab} hasDivider>
        <Tab value="overview" label="개요" />
        <Tab value="schema" label="데이터 스키마" />
        <Tab value="recommend" label="추천 분석" />
        {project.preprocessing ? <Tab value="preprocessing" label="전처리 내역" /> : null}
      </TabList>

      <div style={{ paddingTop: 16 }}>
        {tab === "overview" ? (
          <MetadataList columns="single">
            <MetadataListItem label="데이터 유형">{project.meta.dataType}</MetadataListItem>
            <MetadataListItem label="분석 목적">{project.meta.analysisGoal}</MetadataListItem>
            <MetadataListItem label="원본 파일">{project.file?.fileName ?? "-"}</MetadataListItem>
            <MetadataListItem label="행 수">{analysis.schemaSummary.rowCount.toLocaleString()}행</MetadataListItem>
            <MetadataListItem label="열 수">{analysis.schemaSummary.columnCount}개</MetadataListItem>
            <MetadataListItem label="결측률">
              {(analysis.missingSummary.overallMissingRate * 100).toFixed(1)}%
            </MetadataListItem>
          </MetadataList>
        ) : null}

        {tab === "schema" ? (
          <List hasDividers density="compact">
            {analysis.schemaSummary.columns.map((column) => (
              <ListItem
                key={column.name}
                label={column.name}
                description={`유형: ${column.type} · 예시: ${column.sampleValues.slice(0, 3).join(", ")}`}
              />
            ))}
          </List>
        ) : null}

        {tab === "recommend" ? (
          <List hasDividers density="compact">
            {analysis.chartSpecs.map((chart) => (
              <ListItem key={chart.id} label={chart.title} description={`차트 유형: ${chart.type}`} />
            ))}
            {analysis.mapSpecs.detected ? (
              <ListItem label="지역 분포 지도" description="위치 정보가 감지되어 지도 시각화가 가능합니다" />
            ) : null}
          </List>
        ) : null}

        {tab === "preprocessing" && project.preprocessing ? (
          <MetadataList columns="single">
            <MetadataListItem label="결측치 처리">{project.preprocessing.options.missingStrategy}</MetadataListItem>
            <MetadataListItem label="중복 행 처리">{project.preprocessing.options.duplicateStrategy}</MetadataListItem>
            <MetadataListItem label="이상치 처리">{project.preprocessing.options.outlierStrategy}</MetadataListItem>
            <MetadataListItem label="제거된 행 수">{project.preprocessing.droppedRowCount}행</MetadataListItem>
            <MetadataListItem label="채운 셀">
              {project.preprocessing.filledCellCount.length > 0
                ? project.preprocessing.filledCellCount
                    .map((f) => `${f.column}: ${f.count}건(→${f.fillValue})`)
                    .join(", ")
                : "없음"}
            </MetadataListItem>
            <MetadataListItem label="캡핑된 이상치">
              {project.preprocessing.cappedOutlierCount.length > 0
                ? project.preprocessing.cappedOutlierCount.map((c) => `${c.column}: ${c.count}건`).join(", ")
                : "없음"}
            </MetadataListItem>
            <MetadataListItem label="품질 점수 변화">
              {project.preprocessing.qualityScoreBefore}점 → {project.preprocessing.qualityScoreAfter}점
            </MetadataListItem>
          </MetadataList>
        ) : null}
      </div>
    </div>
  );
}
