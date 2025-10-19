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
import { controlStyle, labelStyle, btnBase, btnSecondary } from '../styles/commonStyles';

export default function MetricsFilters({
  startDate,
  endDate,
  groupBy,
  metric,
  busy,
  rows,
  onStartDateChange,
  onEndDateChange,
  onGroupByChange,
  onMetricChange,
  onQuery,
  onExport
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 16, alignItems: "end", marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            style={controlStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            style={controlStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Group By</label>
          <select
            value={groupBy}
            onChange={(e) => onGroupByChange(e.target.value)}
            style={controlStyle}
          >
            <option value="date">Date</option>
            <option value="model">Model</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Metric</label>
          <select
            value={metric}
            onChange={(e) => onMetricChange(e.target.value)}
            style={controlStyle}
          >
            <option value="input_tokens">Input Tokens</option>
            <option value="output_tokens">Output Tokens</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onQuery}
          disabled={busy}
          style={{
            ...btnBase,
            opacity: busy ? 0.6 : 1,
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          Query
        </button>
        <button
          onClick={onExport}
          disabled={busy || !rows || rows.length === 0}
          style={{
            ...btnSecondary,
            opacity: busy || !rows || rows.length === 0 ? 0.6 : 1,
            cursor: busy || !rows || rows.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          Export CSV
        </button>
      </div>
    </div>
  );
}