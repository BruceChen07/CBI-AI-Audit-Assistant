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

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../utils/api";

export function useAdminMetrics({ days = 30 } = {}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [raw, setRaw] = useState(null);

  const fetchData = async (rangeDays = days) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/admin/metrics/tokens?days=${rangeDays}`, { method: "GET" });
      setRaw(res || {});
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(days);
  }, [days]);

  const totals = useMemo(() => {
    const byDay = raw?.by_day || raw?.days || [];
    const totalInput = raw?.total_input_tokens ?? raw?.summary?.total_input_tokens ?? 0;
    const totalOutput = raw?.total_output_tokens ?? raw?.summary?.total_output_tokens ?? 0;
    const totalCost = raw?.total_cost ?? raw?.summary?.total_cost ?? 0;

    const totalRequests =
      raw?.total_requests ??
      raw?.summary?.total_requests ??
      byDay.reduce((acc, d) => acc + (d.request_count ?? d.requests ?? 0), 0);

    const avgTokensPerReq =
      totalRequests > 0 ? Math.round(((totalInput + totalOutput) / totalRequests) * 100) / 100 : 0;

    const lastDay = byDay[byDay.length - 1] || null;
    const lastDayCost = lastDay?.total_cost ?? 0;
    const goalPercent = totalCost > 0 ? Math.round((lastDayCost / totalCost) * 100) : 0;

    return {
      inputTokens: totalInput,
      outputTokens: totalOutput,
      totalCost,
      totalRequests,
      avgTokensPerReq,
      goalPercent,
    };
  }, [raw]);

  const charts = useMemo(() => {
    const byDay = raw?.by_day || raw?.days || [];
    const byModel = raw?.by_model || raw?.models || [];

    const trendValues = byDay.map((d) => {
      const input = d.input_tokens ?? d.input ?? 0;
      const output = d.output_tokens ?? d.output ?? 0;
      return input + output;
    });

    const modelCostBars = byModel
      .map((m) => ({
        label: m.model || m.name || "unknown",
        value: m.total_cost ?? m.cost ?? 0,
      }))
      .sort((a, b) => b.value - a.value);

    return { trendValues, modelCostBars };
  }, [raw]);

  return {
    loading,
    error,
    raw,
    totals,
    charts,
    refresh: fetchData,
  };
}