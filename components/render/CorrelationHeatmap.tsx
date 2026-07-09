"use client";

// 상관 행렬을 색상 강도 기반 표로 그리기만 하는 순수 렌더러 (계산은 lib/analytics/heatmapMatrix.ts에서 수행)
import { Text } from "@astryxdesign/core";
import type { CorrelationMatrix } from "@/lib/analytics/heatmapMatrix";

function cellBackground(coefficient: number): string {
  const alpha = Math.min(0.85, Math.abs(coefficient) * 0.85);
  return coefficient >= 0 ? `rgba(239,68,68,${alpha})` : `rgba(59,130,246,${alpha})`;
}

export function CorrelationHeatmap({ matrix }: { matrix: CorrelationMatrix }) {
  if (matrix.columns.length === 0) {
    return null;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ padding: "8px 12px", borderBottom: "1px solid #e5e7eb" }} />
            {matrix.columns.map((column) => (
              <th
                key={column}
                style={{
                  textAlign: "center",
                  padding: "8px 12px",
                  borderBottom: "1px solid #e5e7eb",
                  whiteSpace: "nowrap",
                }}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.columns.map((rowColumn) => (
            <tr key={rowColumn}>
              <th
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  borderBottom: "1px solid #f3f4f6",
                  whiteSpace: "nowrap",
                }}
              >
                {rowColumn}
              </th>
              {matrix.columns.map((colColumn) => {
                const cell = matrix.cells[rowColumn][colColumn];
                if (!cell) {
                  return (
                    <td
                      key={colColumn}
                      style={{
                        textAlign: "center",
                        padding: "8px 12px",
                        borderBottom: "1px solid #f3f4f6",
                        color: "#9ca3af",
                      }}
                    >
                      -
                    </td>
                  );
                }
                const useWhiteText = Math.abs(cell.coefficient) > 0.55;
                return (
                  <td
                    key={colColumn}
                    style={{
                      textAlign: "center",
                      padding: "8px 12px",
                      borderBottom: "1px solid #f3f4f6",
                      backgroundColor: cellBackground(cell.coefficient),
                      color: useWhiteText ? "#ffffff" : undefined,
                      fontWeight: rowColumn === colColumn ? 600 : 400,
                    }}
                  >
                    {cell.coefficient.toFixed(2)}
                    {cell.significant ? "*" : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 8 }}>
        <Text color="secondary">* p&lt;0.05 통계적으로 유의</Text>
      </div>
    </div>
  );
}
