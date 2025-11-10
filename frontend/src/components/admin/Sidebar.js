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

export default function Sidebar({ active = "access", onSelect = () => {} }) {
    const items = [
        { key: "access", label: "Access Management" },
        { key: "model", label: "Model Management" },
        { key: "config", label: "Configuration Management" },
        { key: "cost", label: "Cost Management" },
    ];

    return (
        <div style={{ width: 240, borderRight: "1px solid #eee", padding: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Admin Panel</div>

            {items.map((it) => {
                const isActive = it.key === active;
                return (
                    <div
                        key={it.key}
                        onClick={() => onSelect(it.key)}
                        style={{
                            cursor: "pointer",
                            padding: "8px 12px",
                            borderRadius: 8,
                            marginBottom: 6,
                            background: isActive ? "#eef5ff" : "transparent",
                            color: isActive ? "#1d4ed8" : "#333",
                            border: isActive ? "1px solid #cfe0ff" : "1px solid transparent",
                            userSelect: "none",
                        }}
                    >
                        {it.label}
                    </div>
                );
            })}
        </div>
    );
}