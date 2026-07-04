// 프로젝트 상세 화면: 메타데이터와 품질 점수를 보여주고 탭으로 개요/스키마/추천 분석을 전환한다
import { notFound } from "next/navigation";
import { Card, Heading, Text, ProgressBar, Badge, Section } from "@astryxdesign/core";
import { getProject } from "@/lib/data/store";
import { ProjectDetailTabs } from "@/components/project/ProjectDetailTabs";
import { LinkButton } from "@/components/nav/LinkButton";

function qualityVariant(score: number): "success" | "warning" | "error" {
  if (score >= 80) return "success";
  if (score >= 50) return "warning";
  return "error";
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <Section padding={6}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <Heading level={1}>{project.meta.title}</Heading>
            <Text type="supporting" color="secondary">{project.meta.description || "설명이 없습니다"}</Text>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Badge variant={qualityVariant(project.analysis.qualityScore)} label={project.meta.dataType} />
            <LinkButton href={`/projects/${project.meta.id}/analysis`} label="분석 대시보드 보기" variant="primary" />
          </div>
        </div>

        <Card>
          <Text type="label">데이터 품질 점수</Text>
          <ProgressBar
            value={project.analysis.qualityScore}
            label="데이터 품질 점수"
            isLabelHidden
            hasValueLabel
            variant={qualityVariant(project.analysis.qualityScore)}
          />
        </Card>

        <Card>
          <ProjectDetailTabs project={project} />
        </Card>
      </div>
    </Section>
  );
}
