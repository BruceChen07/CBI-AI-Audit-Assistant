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
export default function DonutChart({ input = 0, output = 0, bare = false }) {
  const size = 160;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = Math.max(1, input + output);
  const inRatio = input / total;
  const outRatio = output / total;

  if (bare) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} stroke="#e2e8f0" strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="#3b82f6"
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${c * inRatio} ${c * (1 - inRatio)}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="#6366f1"
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${c * outRatio} ${c * (1 - outRatio)}`}
            transform={`rotate(${360 * inRatio - 90} ${size / 2} ${size / 2})`}
          />
        </svg>
        <div style={{ fontSize: 12, color: "#475569" }}>
          <div style={{ marginBottom: 6 }}>
            <span style={{ display: "inline-block", width: 10, height: 10, background: "#3b82f6", borderRadius: 2, marginRight: 6 }} />
            Input Tokens: <b>{input.toLocaleString?.() ?? input}</b>
          </div>
          <div>
            <span style={{ display: "inline-block", width: 10, height: 10, background: "#6366f1", borderRadius: 2, marginRight: 6 }} />
            Output Tokens: <b>{output.toLocaleString?.() ?? output}</b>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
      <div style={{ color: "#475569", fontSize: 12, marginBottom: 8 }}>Online Listings</div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} stroke="#e2e8f0" strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="#3b82f6"
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${c * inRatio} ${c * (1 - inRatio)}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="#6366f1"
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${c * outRatio} ${c * (1 - outRatio)}`}
            transform={`rotate(${360 * inRatio - 90} ${size / 2} ${size / 2})`}
          />
        </svg>
        <div style={{ fontSize: 12, color: "#475569" }}>
          <div style={{ marginBottom: 6 }}>
            <span style={{ display: "inline-block", width: 10, height: 10, background: "#3b82f6", borderRadius: 2, marginRight: 6 }} />
            Input Tokens: <b>{input}</b>
          </div>
          <div>
            <span style={{ display: "inline-block", width: 10, height: 10, background: "#6366f1", borderRadius: 2, marginRight: 6 }} />
            Output Tokens: <b>{output}</b>
          </div>
        </div>
      </div>
    </div>
  );
}