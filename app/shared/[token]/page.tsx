// 공유 화면: 토큰으로 프로젝트 분석 결과를 로그인 없이 읽기 전용으로 보여주고 댓글을 남길 수 있다
import { notFound } from "next/navigation";
import { Card, Heading, Text, ProgressBar, Badge, Section, MetadataList, MetadataListItem, Divider } from "@astryxdesign/core";
import { getProjectByToken, listComments } from "@/lib/data/shareServer";
import { CommentSection } from "@/components/shared/CommentSection";

function qualityVariant(score: number): "success" | "warning" | "error" {
  if (score >= 80) return "success";
  if (score >= 50) return "warning";
  return "error";
}

export default async function SharedProjectPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const project = await getProjectByToken(token);
  if (!project) notFound();

  const comments = await listComments(project.meta.id);

  return (
    <Section padding={6}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Badge label="읽기 전용 공유 화면" variant="info" />
          <Heading level={1}>{project.meta.title}</Heading>
          <Text type="supporting" color="secondary">{project.meta.description || "설명이 없습니다"}</Text>
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
          <MetadataList columns="single">
            <MetadataListItem label="데이터 유형">{project.meta.dataType}</MetadataListItem>
            <MetadataListItem label="분석 목적">{project.meta.analysisGoal}</MetadataListItem>
            <MetadataListItem label="행 수">{project.analysis.schemaSummary.rowCount.toLocaleString()}행</MetadataListItem>
            <MetadataListItem label="열 수">{project.analysis.schemaSummary.columnCount}개</MetadataListItem>
            <MetadataListItem label="결측률">
              {(project.analysis.missingSummary.overallMissingRate * 100).toFixed(1)}%
            </MetadataListItem>
            <MetadataListItem label="핵심 인사이트">{project.analysis.insightSummary}</MetadataListItem>
          </MetadataList>
        </Card>

        <Divider label="댓글" />
        <CommentSection projectId={project.meta.id} initialComments={comments} />
      </div>
    </Section>
  );
}
