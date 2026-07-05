// 공유 링크 토큰 생성 유틸. 로컬/원격 스토어 양쪽에서 동일한 생성 규칙을 쓴다
export function generateShareToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}
