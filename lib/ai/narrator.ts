// AI narrator 단일 접점. 이 함수만이 외부 AI API를 호출하며, 인자로 요약 통계(NarratorInput)만 받는다.
import type { NarratorInput } from "@/types/analysis";
import { NARRATOR_SYSTEM_PROMPT, buildNarratorUserPrompt } from "./prompts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-sonnet-5";

export const isAiConfigured = Boolean(process.env.ANTHROPIC_API_KEY);

export async function generateNarrative(input: NarratorInput): Promise<string> {
  if (!isAiConfigured) {
    throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다");
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY as string,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: NARRATOR_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildNarratorUserPrompt(input) }],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI 설명 생성 요청이 실패했습니다 (status: ${response.status})`);
  }

  const data = await response.json();
  const narrative = data?.content?.[0]?.text;
  if (typeof narrative !== "string" || narrative.trim().length === 0) {
    throw new Error("AI 응답에서 설명 텍스트를 찾을 수 없습니다");
  }

  return narrative;
}
