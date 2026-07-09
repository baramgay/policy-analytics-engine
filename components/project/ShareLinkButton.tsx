"use client";

// 프로젝트 상세 화면의 공유 링크 생성 버튼: 토큰을 발급하고 링크를 클립보드에 복사한다
import { useState } from "react";
import { Button, useToast } from "@astryxdesign/core";
import { createShare } from "@/lib/data/shareClient";

export function ShareLinkButton({ projectId }: { projectId: string }) {
  const toast = useToast();
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreate() {
    setIsCreating(true);
    try {
      const share = await createShare(projectId);
      const url = `${window.location.origin}/shared/${share.token}`;
      await navigator.clipboard.writeText(url);
      toast({ body: "공유 링크가 생성되어 클립보드에 복사되었습니다" });
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Button label="공유 링크 생성" isLoading={isCreating} clickAction={handleCreate} />
  );
}
