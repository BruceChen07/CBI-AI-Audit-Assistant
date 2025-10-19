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
import StatCard from "./StatCard";

function MiniTrend({ values = [] }) {
  const w = 120;
  const h = 36;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const points = values.map((v, i) => `${i * step},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h}>
      <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={points} />
    </svg>
  );
}

export default function StatCards({ totals, trendValues }) {
  const goal = typeof totals?.goalPercent === "number" ? totals.goalPercent : 0;
  const reviews = totals?.totalRequests ?? 0;
  const sentiment = totals?.outputTokens ?? 0; // Still mapped to "total output tokens" as before
  const avgRating = totals?.avgTokensPerReq ?? 0; // Still mapped to "average tokens/request" as before

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 16,
        marginBottom: 16,
      }}
    >
      <StatCard
        title="Review Invite Goal"
        value={goal}
        suffix="%"
        note="vs last month"
        right={<MiniTrend values={trendValues?.slice(-12)} />}
      />
      <StatCard
        title="Reviews Received"
        value={reviews}
        note="vs last month"
        right={<MiniTrend values={trendValues?.slice(-12)} />}
      />
      <StatCard
        title="Sentiment"
        value={sentiment}
        note="vs last month"
        right={<MiniTrend values={trendValues?.slice(-12)} />}
      />
      <StatCard title="Avg. Rating" value={avgRating} note="vs last month" />
    </div>
  );
}