"use client";

// 원본 데이터 미리보기 테이블: TanStack Table로 정렬만 제공하는 순수 렌더러 (집계/통계 계산은 하지 않는다)
import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import type { ParsedDataset } from "@/types/analysis";

const PREVIEW_ROW_LIMIT = 50;

export function DataPreviewTable({ dataset }: { dataset: ParsedDataset }) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<ParsedDataset["rows"][number]>[]>(
    () =>
      dataset.columns.map((column) => ({
        id: column,
        accessorKey: column,
        header: column,
        cell: (info) => {
          const value = info.getValue();
          return value === null || value === undefined || value === "" ? (
            <span style={{ color: "#9ca3af" }}>-</span>
          ) : (
            String(value)
          );
        },
      })),
    [dataset.columns],
  );

  const previewRows = useMemo(() => dataset.rows.slice(0, PREVIEW_ROW_LIMIT), [dataset.rows]);

  const table = useReactTable({
    data: previewRows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  style={{
                    textAlign: "left",
                    padding: "8px 12px",
                    borderBottom: "1px solid #e5e7eb",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    userSelect: "none",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    <ArrowUpDown size={12} />
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  style={{ padding: "8px 12px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {dataset.rows.length > PREVIEW_ROW_LIMIT ? (
        <p style={{ fontSize: 12, color: "#9ca3af", padding: "8px 12px" }}>
          전체 {dataset.rows.length.toLocaleString()}행 중 {PREVIEW_ROW_LIMIT}행 미리보기
        </p>
      ) : null}
    </div>
  );
}
