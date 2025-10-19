/*
 * Author: Bruce Chen <bruce.chen@effem.com>
 * Date: 2025-08-29
 * 
 * Copyright (c) 2025 Mars Corporation
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import React, { useEffect, useCallback, useMemo, useState } from "react";
import { apiFetch } from "../../utils/api";
import MetricsFilters from "./components/MetricsFilters";
import MetricsSummary from "./components/MetricsSummary";
import MetricsCharts from "./components/MetricsCharts";
import MetricsTable from "./components/MetricsTable";
import { toCsv, downloadCsv, getDefaultDateRange, fmtUsd2 } from "./utils/formatters";

export default function AdminMetricsPage() {
  const [data, setData] = useState({ summary: {}, rows: [] });
  const [busy, setBusy] = useState(false);
  const { startDate: defaultStartDate, endDate: defaultEndDate } = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [groupBy, setGroupBy] = useState("date");
  const [metric, setMetric] = useState("input_tokens");

  const rows = useMemo(() => data.rows || [], [data.rows]);

  const totalCost = useMemo(() => data?.summary?.total_cost ?? 0, [data.summary]);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const params = new URLSearchParams({
        date_from: startDate,
        date_to: endDate,
        group_by: groupBy,
      });
      const res = await apiFetch(
        `/admin/metrics/tokens?${params.toString()}`,
        { method: "GET" }
      );
      const rows = groupBy === "model" ? (res.by_model || []) : (res.by_date || []);
      setData({ summary: res.summary || {}, rows });
    } catch (err) {
      console.error("Failed to load metrics:", err);
      setData({ summary: {}, rows: [] });
    } finally {
      setBusy(false);
    }
  }, [startDate, endDate, groupBy]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = () => {
    if (!rows || rows.length === 0) return;
    const csv = toCsv(rows);
    downloadCsv(csv, `metrics_${startDate}_${endDate}.csv`);
  };

  return (
    <div style={{ padding: 20 }}>
      {/* Title + elegant total cost badge */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2 style={{ margin: 0, color: "#1a202c" }}>Cost Management</h2>
        <div
          title="Total Cost"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 999,
            background: "linear-gradient(135deg, #ecfff7 0%, #e6fffb 100%)",
            color: "#0f766e",
            boxShadow:
              "0 6px 18px rgba(16,185,129,0.2), inset 0 0 0 1px rgba(16,185,129,0.2)",
          }}
        >
          {/* Simple icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 7h16a2 2 0 0 1 2 2v8a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9a2 2 0 0 1 2-2zm0 4h16"
              stroke="#10b981"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Total Cost</span>
          <strong style={{ fontSize: 18 }}>{fmtUsd2(totalCost)}</strong>
        </div>
      </div>

      {/* Original filters, summary cards, charts, and table */}
      {/* Note: The following content is original; no changes needed */}
      <MetricsFilters
        startDate={startDate}
        endDate={endDate}
        groupBy={groupBy}
        metric={metric}
        busy={busy}
        rows={rows}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onGroupByChange={setGroupBy}
        onMetricChange={setMetric}
        onQuery={load}
        onExport={handleExport}
      />

      <MetricsSummary data={data} />
      
      <MetricsCharts rows={rows} groupBy={groupBy} metric={metric} />
      
      <MetricsTable rows={rows} groupBy={groupBy} />
    </div>
  );
}