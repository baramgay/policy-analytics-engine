// AI narrator 단일 접점. 이 함수만이 외부 AI API를 호출하며, 인자로 요약 통계(NarratorInput)만 받는다.
// Qwen(OpenAI 호환 모드)을 사용하므로 다른 OpenAI 호환 provider로도 host/model만 바꾸면 전환 가능하다.
import type { NarratorInput } from "@/types/analysis";
import { NARRATOR_SYSTEM_PROMPT, buildNarratorUserPrompt } from "./prompts";

const QWEN_MODEL = "qwen-plus";

export const isAiConfigured = Boolean(process.env.QWEN_API_KEY && process.env.QWEN_API_HOST);

export async function generateNarrative(input: NarratorInput): Promise<string> {
  if (!isAiConfigured) {
    throw new Error("QWEN_API_KEY 또는 QWEN_API_HOST가 설정되지 않았습니다");
  }

  const response = await fetch(`${process.env.QWEN_API_HOST}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.QWEN_API_KEY}`,
    },
    body: JSON.stringify({
      model: QWEN_MODEL,
      max_tokens: 1024,
      messages: [
        { role: "system", content: NARRATOR_SYSTEM_PROMPT },
        { role: "user", content: buildNarratorUserPrompt(input) },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI 설명 생성 요청이 실패했습니다 (status: ${response.status})`);
  }

  const data = await response.json();
  const narrative = data?.choices?.[0]?.message?.content;
  if (typeof narrative !== "string" || narrative.trim().length === 0) {
    throw new Error("AI 응답에서 설명 텍스트를 찾을 수 없습니다");
  }

  return narrative;
}
