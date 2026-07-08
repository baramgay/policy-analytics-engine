// AI narrator 단일 접점 라우트. 요청 본문에서 문서화된 요약 필드만 골라내어 넘기므로,
// 클라이언트가 어떤 필드를 추가로 보내더라도 원본 행 데이터가 AI 호출에 섞여 들어갈 수 없다.
import { NextResponse } from "next/server";
import type { NarratorInput } from "@/types/analysis";
import { generateNarrative, isAiConfigured } from "@/lib/ai/narrator";

function pickNarratorInput(body: unknown): NarratorInput | null {
  if (!body || typeof body !== "object") return null;
  const source = body as Record<string, unknown>;

  const required = [
    "projectTitle",
    "dataType",
    "analysisGoal",
    "qualityScore",
    "schemaSummary",
    "missingSummary",
    "numericSummary",
    "categoricalSummary",
    "ruleBasedInsight",
  ] as const;

  for (const key of required) {
    if (!(key in source)) return null;
  }

  return {
    projectTitle: String(source.projectTitle),
    dataType: source.dataType as NarratorInput["dataType"],
    analysisGoal: String(source.analysisGoal),
    qualityScore: Number(source.qualityScore),
    schemaSummary: source.schemaSummary as NarratorInput["schemaSummary"],
    missingSummary: source.missingSummary as NarratorInput["missingSummary"],
    numericSummary: source.numericSummary as NarratorInput["numericSummary"],
    categoricalSummary: source.categoricalSummary as NarratorInput["categoricalSummary"],
    ruleBasedInsight: String(source.ruleBasedInsight),
    correlationSummary: source.correlationSummary as NarratorInput["correlationSummary"],
    categoricalCorrelationSummary:
      source.categoricalCorrelationSummary as NarratorInput["categoricalCorrelationSummary"],
    vifSummary: source.vifSummary as NarratorInput["vifSummary"],
    groupComparisonSummary: source.groupComparisonSummary as NarratorInput["groupComparisonSummary"],
    timeSeriesSummary: source.timeSeriesSummary as NarratorInput["timeSeriesSummary"],
  };
}

export async function POST(request: Request) {
  if (!isAiConfigured) {
    return NextResponse.json(
      { error: "AI 설명 기능이 아직 구성되지 않았습니다" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문을 해석할 수 없습니다" }, { status: 400 });
  }

  const input = pickNarratorInput(body);
  if (!input) {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다" }, { status: 400 });
  }

  try {
    const narrative = await generateNarrative(input);
    return NextResponse.json({ narrative });
  } catch {
    return NextResponse.json(
      { error: "AI 설명 생성 중 오류가 발생했습니다" },
      { status: 502 }
    );
  }
}
