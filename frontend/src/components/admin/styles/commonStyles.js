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

// Control styles
export const controlStyle = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  fontSize: "14px",
  backgroundColor: "#ffffff",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
};

// Label styles
export const labelStyle = {
  display: "block",
  marginBottom: "4px",
  fontSize: "14px",
  fontWeight: "500",
  color: "#374151",
};

// Base button styles
export const btnBase = {
  padding: "8px 16px",
  border: "none",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: "500",
  cursor: "pointer",
  transition: "all 0.2s",
  backgroundColor: "#3b82f6",
  color: "#ffffff",
};

// Primary button styles
export const btnPrimary = {
  ...btnBase,
  backgroundColor: "#3b82f6",
  color: "#ffffff",
};

// Secondary button styles
export const btnSecondary = {
  ...btnBase,
  backgroundColor: "#6b7280",
  color: "#ffffff",
};

// Ghost button styles
export const btnGhost = {
  ...btnBase,
  backgroundColor: "transparent",
  color: "#6b7280",
  border: "1px solid #d1d5db",
};

// Table styles
export const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
};

// Cell styles
export const cellStyle = {
  padding: "12px",
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
};