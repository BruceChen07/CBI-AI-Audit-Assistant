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

export default function TrendsChart({ data = [] }) {
  const w = 520;
  const h = 180;
  const pad = 16;
  const max = Math.max(1, ...data);
  const bw = (w - pad * 2) / (data.length || 1);

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
      <div style={{ color: "#475569", fontSize: 12, marginBottom: 8 }}>Review Trends</div>
      <svg width={w} height={h}>
        {data.map((v, i) => {
          const barH = Math.max(2, (v / max) * (h - pad * 2));
          return (
            <rect
              key={i}
              x={pad + i * bw + 2}
              y={h - pad - barH}
              width={Math.max(2, bw - 4)}
              height={barH}
              rx="3"
              fill="#3b82f6"
              opacity={0.85}
            />
          );
        })}
      </svg>
    </div>
  );
}