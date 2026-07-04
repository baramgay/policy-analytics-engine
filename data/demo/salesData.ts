// 데모용 카드매출 원본 데이터셋. 시드 고정 난수로 매 빌드마다 동일한 값을 생성한다
import type { ParsedDataset } from "@/types/analysis";

const REGIONS = ["창원시", "진주시", "김해시", "양산시", "거제시", "통영시"] as const;
const CATEGORIES = ["음식점", "소매", "숙박", "여가서비스", "교통"] as const;
const MONTHS = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"];

const REGION_BASE: Record<(typeof REGIONS)[number], number> = {
  창원시: 9500,
  진주시: 5200,
  김해시: 6100,
  양산시: 4300,
  거제시: 3600,
  통영시: 2900,
};

const CATEGORY_FACTOR: Record<(typeof CATEGORIES)[number], number> = {
  음식점: 1.3,
  소매: 1.1,
  숙박: 0.6,
  여가서비스: 0.5,
  교통: 0.4,
};

function createSeededRandom(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

export function buildSalesDataset(): ParsedDataset {
  const rnd = createSeededRandom(7);
  const rows: ParsedDataset["rows"] = [];

  for (const month of MONTHS) {
    for (const region of REGIONS) {
      for (const category of CATEGORIES) {
        const noise = 0.85 + rnd() * 0.3;
        const sales = Math.round(REGION_BASE[region] * CATEGORY_FACTOR[category] * noise * 10000);
        const payments = Math.round((sales / 38000) * (0.9 + rnd() * 0.2));
        const isMissing = rnd() < 0.03;
        rows.push({
          날짜: month,
          지역: region,
          업종: category,
          매출액: isMissing ? null : sales,
          결제건수: isMissing ? null : payments,
        });
      }
    }
  }

  return { columns: ["날짜", "지역", "업종", "매출액", "결제건수"], rows };
}
