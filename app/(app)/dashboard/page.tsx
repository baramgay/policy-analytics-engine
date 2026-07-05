// 대시보드 화면: 저장된 프로젝트 목록과 핵심 지표(KPI)를 보여준다. 계산은 이미 끝난 값만 표시한다
import { FolderKanban, Gauge, FileStack, Sparkles } from "lucide-react";
import { Grid, Card, Heading, Text, Section } from "@astryxdesign/core";
import { listProjects } from "@/lib/data/store";
import { LinkButton } from "@/components/nav/LinkButton";
import { ProjectListPanel } from "@/components/dashboard/ProjectListPanel";

export default async function DashboardPage() {
  const projects = await listProjects();
  const projectCount = projects.length;
  const avgQuality = projectCount
    ? Math.round(projects.reduce((sum, p) => sum + p.analysis.qualityScore, 0) / projectCount)
    : 0;
  const totalRows = projects.reduce((sum, p) => sum + p.analysis.schemaSummary.rowCount, 0);
  const totalCharts = projects.reduce((sum, p) => sum + p.analysis.chartSpecs.length, 0);

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
            <Heading level={1}>대시보드</Heading>
            <Text type="supporting" color="secondary">
              업로드한 데이터의 분석 현황을 한눈에 확인합니다
            </Text>
          </div>
          <LinkButton href="/upload" label="새 프로젝트 업로드" variant="primary" />
        </div>

        <Grid columns={{ minWidth: 220, max: 4 }} gap={4}>
          <Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <FolderKanban size={20} />
              <Text type="large" weight="bold">{projectCount}</Text>
              <Text type="supporting" color="secondary">전체 프로젝트</Text>
            </div>
          </Card>
          <Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Gauge size={20} />
              <Text type="large" weight="bold">{avgQuality}점</Text>
              <Text type="supporting" color="secondary">평균 데이터 품질</Text>
            </div>
          </Card>
          <Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <FileStack size={20} />
              <Text type="large" weight="bold">{totalRows.toLocaleString()}</Text>
              <Text type="supporting" color="secondary">누적 분석 행 수</Text>
            </div>
          </Card>
          <Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Sparkles size={20} />
              <Text type="large" weight="bold">{totalCharts}</Text>
              <Text type="supporting" color="secondary">생성된 차트 수</Text>
            </div>
          </Card>
        </Grid>

        <ProjectListPanel projects={projects} />
      </div>
    </Section>
  );
}
