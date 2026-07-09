"use client";

// 공유 화면 댓글 목록 + 작성 폼 (로그인 불필요, 작성자명은 자유 입력)
import { useState } from "react";
import { Card, FormLayout, TextInput, TextArea, Button, List, ListItem, Text } from "@astryxdesign/core";
import type { ProjectComment } from "@/lib/data/types";
import { addComment } from "@/lib/data/shareClient";

export function CommentSection({
  projectId,
  initialComments,
}: {
  projectId: string;
  initialComments: ProjectComment[];
}) {
  const [comments, setComments] = useState(initialComments);
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isReady = authorName.trim().length > 0 && content.trim().length > 0;

  async function handleSubmit() {
    if (!isReady) return;
    setIsSaving(true);
    try {
      const comment = await addComment(projectId, { authorName: authorName.trim(), content: content.trim() });
      setComments((prev) => [comment, ...prev]);
      setAuthorName("");
      setContent("");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <FormLayout>
          <TextInput label="이름" value={authorName} onChange={setAuthorName} placeholder="작성자명" />
          <TextArea label="댓글" value={content} onChange={setContent} rows={3} placeholder="의견을 남겨주세요" />
          <Button
            label="댓글 등록"
            variant="primary"
            isDisabled={!isReady || isSaving}
            isLoading={isSaving}
            clickAction={handleSubmit}
          />
        </FormLayout>
      </Card>

      <Card>
        {comments.length === 0 ? (
          <Text color="secondary">아직 댓글이 없습니다.</Text>
        ) : (
          <List hasDividers density="compact">
            {comments.map((comment) => (
              <ListItem
                key={comment.id}
                label={comment.authorName}
                description={`${comment.content} · ${new Date(comment.createdAt).toLocaleString("ko-KR")}`}
              />
            ))}
          </List>
        )}
      </Card>
    </div>
  );
}
