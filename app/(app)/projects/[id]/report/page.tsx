// 리포트 화면: 규칙 기반 리포트 미리보기/저장/복사
import { notFound } from "next/navigation";
import { Heading, Text, Section } from "@astryxdesign/core";
import { getProject } from "@/lib/data/store";
import { ReportView } from "@/components/report/ReportView";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <Section padding={6}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <Heading level={1}>리포트</Heading>
          <Text type="supporting" color="secondary">{project.meta.title}</Text>
        </div>
        <ReportView project={project} />
      </div>
    </Section>
  );
}
