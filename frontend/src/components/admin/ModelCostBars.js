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

export default function ModelCostBars({ items = [] }) {
  const max = Math.max(1, ...items.map((i) => i.value || 0));
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
      <div style={{ color: "#475569", fontSize: 12, marginBottom: 8 }}>Avg. Rating (by model cost)</div>
      <div style={{ display: "grid", gap: 8 }}>
        {items.slice(0, 6).map((i, idx) => (
          <div key={`${i.label}-${idx}`}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#475569" }}>
              <span>{i.label}</span>
              <span>{i.value?.toFixed ? i.value.toFixed(4) : i.value}</span>
            </div>
            <div style={{ background: "#e2e8f0", height: 8, borderRadius: 999, overflow: "hidden" }}>
              <div
                style={{
                  width: `${(i.value / max) * 100}%`,
                  height: 8,
                  background: "#3b82f6",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}