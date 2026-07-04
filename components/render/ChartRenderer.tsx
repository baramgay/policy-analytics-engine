"use client";

// 분석 엔진이 산출한 ChartSpec을 Recharts로 그리기만 하는 순수 렌더러 (여기서 어떤 계산도 하지 않는다)
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartSpec } from "@/types/analysis";

const PIE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

export function ChartRenderer({ spec }: { spec: ChartSpec }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      {spec.type === "bar" ? (
        <BarChart data={spec.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={spec.xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey={spec.yKey} fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      ) : spec.type === "line" ? (
        <LineChart data={spec.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={spec.xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line type="monotone" dataKey={spec.yKey} stroke="#3b82f6" strokeWidth={2} dot={false} />
        </LineChart>
      ) : (
        <PieChart>
          <Tooltip />
          <Pie
            data={spec.data}
            dataKey={spec.yKey}
            nameKey={spec.xKey}
            outerRadius={100}
            label={(entry) => String(entry.name)}
          >
            {spec.data.map((_, index) => (
              <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      )}
    </ResponsiveContainer>
  );
}
