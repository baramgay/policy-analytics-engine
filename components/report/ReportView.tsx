"use client";

// 리포트 화면: 규칙 기반으로 생성한 리포트 본문을 미리보기하고 저장/복사한다 (AI 미사용)
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Divider, Markdown, Text, List, ListItem, useToast } from "@astryxdesign/core";
import type { ProjectRecord } from "@/types/analysis";
import { buildReportMarkdown } from "@/lib/report/buildReport";
import { buildReportHtml } from "@/lib/report/exportHtml";
import { addReport } from "@/lib/data/store";

export function ReportView({ project }: { project: ProjectRecord }) {
  const router = useRouter();
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const content = useMemo(() => buildReportMarkdown(project.meta, project.analysis), [project]);

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    toast({ body: "리포트 내용이 복사되었습니다" });
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href);
    toast({ body: "공유 링크가 복사되었습니다" });
  }

  function handleExportPdf() {
    window.print();
  }

  function handleExportHtml() {
    const html = buildReportHtml(project.meta, project.analysis);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.meta.title || "report"}_${new Date().toISOString().slice(0, 10)}.html`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ body: "리포트가 HTML로 내보내졌습니다" });
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await addReport(project.meta.id, { title: `${project.meta.title} 리포트`, content });
      toast({ body: "리포트가 저장되었습니다" });
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Card>
        <div
          className="no-print"
          style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 16 }}
        >
          <Button label="링크 복사" onClick={handleCopyLink} />
          <Button label="인쇄 / PDF 저장" onClick={handleExportPdf} />
          <Button label="HTML로 내보내기" onClick={handleExportHtml} />
          <Button label="복사" onClick={handleCopy} />
          <Button label="리포트 저장" variant="primary" isLoading={isSaving} clickAction={handleSave} />
        </div>
        <Markdown>{content}</Markdown>
      </Card>

      <Divider label="저장된 리포트 이력" />

      <Card>
        {project.reports.length === 0 ? (
          <Text color="secondary">아직 저장된 리포트가 없습니다.</Text>
        ) : (
          <List hasDividers density="compact">
            {project.reports.map((report) => (
              <ListItem
                key={report.id}
                label={report.title}
                description={new Date(report.createdAt).toLocaleString("ko-KR")}
              />
            ))}
          </List>
        )}
      </Card>
    </div>
  );
}
