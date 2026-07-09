// 댓글 작성 API. service-role 클라이언트로 project_comments에 기록한다(anon 키는 이 테이블에 직접 접근 불가)
import { NextResponse } from "next/server";
import { addCommentServer } from "@/lib/data/shareMutations.server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const projectId = typeof body?.projectId === "string" ? body.projectId : null;
  const authorName = typeof body?.authorName === "string" ? body.authorName.trim() : "";
  const content = typeof body?.content === "string" ? body.content.trim() : "";

  if (!projectId || !authorName || !content) {
    return NextResponse.json({ error: "projectId, authorName, content가 필요합니다." }, { status: 400 });
  }

  try {
    const comment = await addCommentServer(projectId, { authorName, content });
    return NextResponse.json(comment);
  } catch {
    return NextResponse.json({ error: "댓글 저장에 실패했습니다." }, { status: 500 });
  }
}
