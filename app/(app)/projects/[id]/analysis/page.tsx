// 분석 대시보드 화면: 규칙 기반 엔진이 계산한 차트/통계/지도와 AI 설명 접점을 탭으로 보여준다
import { notFound } from "next/navigation";
import { Card, Grid, Heading, Text, Section } from "@astryxdesign/core";
import { getProject } from "@/lib/data/store";
import { AnalysisDashboardTabs } from "@/components/analysis/AnalysisDashboardTabs";
import { LinkButton } from "@/components/nav/LinkButton";

export default async function AnalysisDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  const { analysis } = project;

  return (
    <Section padding={6}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <Heading level={1}>분석 대시보드</Heading>
            <Text type="supporting" color="secondary">{project.meta.title}</Text>
          </div>
          <LinkButton href={`/projects/${project.meta.id}/report`} label="리포트 생성" variant="primary" />
        </div>

        <Grid columns={{ minWidth: 200, max: 4 }} gap={4}>
          <Card>
            <Text type="large" weight="bold">{analysis.qualityScore}점</Text>
            <Text type="supporting" color="secondary">데이터 품질 점수</Text>
          </Card>
          <Card>
            <Text type="large" weight="bold">{analysis.schemaSummary.rowCount.toLocaleString()}</Text>
            <Text type="supporting" color="secondary">전체 행 수</Text>
          </Card>
          <Card>
            <Text type="large" weight="bold">{(analysis.missingSummary.overallMissingRate * 100).toFixed(1)}%</Text>
            <Text type="supporting" color="secondary">전체 결측률</Text>
          </Card>
          <Card>
            <Text type="large" weight="bold">{analysis.chartSpecs.length}</Text>
            <Text type="supporting" color="secondary">추천 차트 수</Text>
          </Card>
        </Grid>

        <Card>
          <AnalysisDashboardTabs project={project} />
        </Card>
      </div>
    </Section>
  );
}
