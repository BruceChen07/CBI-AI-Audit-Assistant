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
import StatCard from '../StatCard';
import { fmtInt, fmtUsd2 } from '../utils/formatters';

export default function MetricsSummary({ data }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 12,
        marginBottom: 12,
      }}
    >
      <StatCard
        title="Requests"
        value={fmtInt(data.summary?.total_requests)}
        gradient={["#f8fafc", "#f1f5f9"]}
        accent="#64748b"
      />
      <StatCard
        title="Input Tokens"
        value={fmtInt(data.summary?.total_input_tokens)}
        gradient={["#f0f7ff", "#e8f3ff"]}
        accent="#60a5fa"
      />
      <StatCard
        title="Output Tokens"
        value={fmtInt(data.summary?.total_output_tokens)}
        gradient={["#fff7ed", "#fff1e6"]}
        accent="#f59e0b"
      />
      <StatCard
        title="Total Cost"
        value={fmtUsd2(data.summary?.total_cost)}
        gradient={["#ecfff7", "#e6fffb"]}
        accent="#10b981"
      />
    </div>
  );
}