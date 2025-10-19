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

import React from 'react';
import {
  ResponsiveContainer,
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ComposedChart, Area, Line,
} from "recharts";

function ChartCard({ title, children, style }) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        borderRadius: 12,
        padding: 20,
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        border: "1px solid #e2e8f0",
        ...style,
      }}
    >
      {title && (
        <h3
          style={{
            margin: "0 0 16px 0",
            fontSize: 16,
            fontWeight: 600,
            color: "#1e293b",
          }}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

function GroupedBarChart({
  title = "",
  rows = [],
  labelKey = "date",
  series = [
    { key: "input_tokens", label: "Input Tokens", color: "#60a5fa" },
    { key: "output_tokens", label: "Output Tokens", color: "#f59e0b" },
  ],
  width = 640,
  height = 260,
  highlightKey = null,
  bare = false,
}) {
  if (!rows || rows.length === 0) return null;

  const formatInt = (v) => {
    const n = Number(v) || 0;
    return n.toLocaleString();
  };

  // Keep consistent with original logic: widen the canvas by data size; outer container supports horizontal scrolling
  const containerStyle = {
    width: "100%",
    overflowX: "auto",
  };
  const innerStyle = {
    width,
    height,
    minWidth: width,
  };

  // Highlight: lower opacity for non-selected series
  const isHi = (key) => (highlightKey ? key === highlightKey : true);
  const barOpacity = (key) => (isHi(key) ? 0.95 : 0.6);

  return (
    <div style={containerStyle}>
      <div style={innerStyle}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={rows}
            margin={{ top: 8, right: 12, bottom: bare ? 8 : 28, left: 8 }}
            barCategoryGap={24}
            barGap={6}
          >
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis dataKey={labelKey} tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis tickFormatter={formatInt} tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip
              wrapperStyle={{ outline: "none" }}
              contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
              formatter={(v, n) => [formatInt(v), series.find(s => s.key === n)?.label ?? n]}
              labelFormatter={(l) => `${l}`}
            />
            <Legend />
            {series.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={s.color}
                opacity={barOpacity(s.key)}
                radius={[6, 6, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SimpleLineChart({
  title = "",
  rows = [],
  valueKey = "cost",
  labelKey = "date",
  width = 640,
  height = 220,
  bare = false,
}) {
  if (!rows || rows.length === 0) return null;

  const formatUsd2 = (v) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(v || 0));

  const containerStyle = {
    width: "100%",
    overflowX: "auto",
  };
  const innerStyle = {
    width,
    height,
    minWidth: width,
  };

  return (
    <div style={containerStyle}>
      <div style={innerStyle}>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart
            data={rows}
            margin={{ top: 8, right: 12, bottom: bare ? 8 : 28, left: 8 }}
          >
            <defs>
              <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis dataKey={labelKey} tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis tickFormatter={formatUsd2} tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip
              wrapperStyle={{ outline: "none" }}
              contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
              formatter={(v) => [formatUsd2(v), "Cost"]}
              labelFormatter={(l) => `${l}`}
            />
            <Area
              type="monotone"
              dataKey={valueKey}
              fill="url(#costGrad)"
              stroke="none"
            />
            <Line
              type="monotone"
              dataKey={valueKey}
              stroke="#10b981"
              strokeWidth={2.2}
              dot={{ r: 3, stroke: "#0f172a", strokeWidth: 0.6, fill: "#10b981" }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function MetricsCharts({ rows, groupBy, metric }) {
  if (!rows || rows.length === 0) {
    return (
      <div style={{ color: "#667085", marginBottom: 12 }}>
        No chart: empty data
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(12, 1fr)",
        gap: 12,
        marginBottom: 12,
      }}
    >
      <ChartCard title="Tokens" style={{ gridColumn: "span 7" }}>
        <GroupedBarChart
          rows={rows}
          labelKey={groupBy === "model" ? "model" : "date"}
          series={[
            { key: "input_tokens", label: "Input Tokens", color: "#60a5fa" },
            { key: "output_tokens", label: "Output Tokens", color: "#f59e0b" },
          ]}
          width={Math.max(720, rows.length * (2 * 18 + 18) + 120)}
          height={410}
          highlightKey={metric}
          bare
        />
      </ChartCard>

      <ChartCard title="Cost" style={{ gridColumn: "span 5" }}>
        <SimpleLineChart
          rows={rows}
          valueKey="cost"
          labelKey={groupBy === "model" ? "model" : "date"}
          width={Math.max(520, rows.length * 24 + 120)}
          height={370}
          bare
        />
      </ChartCard>
    </div>
  );
}

export { GroupedBarChart, SimpleLineChart, ChartCard };