// 공유 링크 생성 API. service-role 클라이언트로 project_shares에 기록한다(anon 키는 이 테이블에 직접 접근 불가)
import { NextResponse } from "next/server";
import { createShareServer } from "@/lib/data/shareMutations.server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const projectId = typeof body?.projectId === "string" ? body.projectId : null;
  const expiresAt = typeof body?.expiresAt === "string" ? body.expiresAt : null;

  if (!projectId) {
    return NextResponse.json({ error: "projectId가 필요합니다." }, { status: 400 });
  }

  try {
    const share = await createShareServer(projectId, expiresAt);
    return NextResponse.json(share);
  } catch {
    return NextResponse.json({ error: "공유 링크 생성에 실패했습니다." }, { status: 500 });
  }
}
