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

export default function Topbar({ username, loading, error }) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
            }}
        >
            <div>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Reviews</h1>
                <div style={{ color: "#64748b", fontSize: 12 }}>
                    Welcome back, {username}{loading ? " · Loading…" : ""}{error ? " · Load failed" : ""}
                </div>
            </div>
            {/* 新增：返回首页按钮 */}
            <button
                onClick={() => {
                    // 使用哈希路由跳转到首页，保持登录态
                    window.location.hash = "#/";
                }}
                style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: "#e2e8f0",
                    color: "#1f2937",
                    border: "1px solid #cbd5e1",
                    cursor: "pointer",
                }}
                title="Home"
            >
                return to home page
            </button>
        </div>
    );
}