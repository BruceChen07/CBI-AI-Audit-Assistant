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
// File: ModelCatalog.js (keep only card details + collapsible advanced fields version)
import React, { useMemo, useState } from "react";
import { btnSecondary, cellStyle } from "../styles/commonStyles";

export default function ModelCatalog({
  columns = [],
  rows = [],
  selectedRow = null,
  title = "Model Catalog",
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Prioritize key fields (adjust according to your CSV field names)
  const priorityFields = useMemo(
    () => [
      "Model Name",
      "Provider",
      "Type",
      "Input Cost (1M Tokens)",
      "Output Cost (1M Tokens)",
      "Context Window",
      "Max Tokens",
      "Supports JSON",
      "Supports Vision",
    ],
    []
  );

  // User-friendly value formatting
  const fmt = (k, v) => {
    if (v === true || String(v).toLowerCase() === "true") return "Yes";
    if (v === false || String(v).toLowerCase() === "false") return "No";
    if (v === null || v === undefined || String(v).trim() === "") return "-";
    // Keep dollar sign for cost fields
    if (/cost/i.test(k) && !/^[-$0-9.,\s]+$/.test(String(v))) return String(v);
    return String(v);
  };

  // Display only the currently selected model
  if (!selectedRow) {
    return (
      <div
        style={{
          padding: 16,
          background: "#f7f7f8",
          border: "1px dashed #d0d7de",
          borderRadius: 8,
          color: "#57606a",
        }}
      >
        Please select a model on the left, or choose one in Settings to view details
      </div>
    );
  }

  // Assemble detail data
  const priorityItems = priorityFields
    .filter((k) => columns.includes(k))
    .map((k) => ({ label: k, value: fmt(k, selectedRow[k]) }));

  const advancedKeys = columns.filter((k) => !priorityFields.includes(k));
  const advancedItems = advancedKeys.map((k) => ({
    label: k,
    value: fmt(k, selectedRow[k]),
  }));

  // Unified light card style
  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    boxShadow: "0 1px 2px rgba(16,24,40,.06)",
  };

  const headerStyle = {
    padding: "14px 16px",
    borderBottom: "1px solid #eef2f6",
    fontSize: 16,
    fontWeight: 600,
    color: "#111827",
  };

  const bodyStyle = {
    padding: 16,
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  };

  const itemStyle = {
    display: "flex",
    flexDirection: "column",
    padding: 12,
    background: "#fafafa",
    border: "1px solid #f0f0f0",
    borderRadius: 8,
  };

  const labelStyle = {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  };

  const valueStyle = {
    fontSize: 14,
    color: "#111827",
    wordBreak: "break-word",
  };

  const sectionTitleStyle = {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 13,
    color: "#374151",
    fontWeight: 600,
  };

  // Render
  return (
    <div style={{ ...cardStyle }}>
      <div style={headerStyle}>{title}</div>
      <div style={bodyStyle}>
        {/* Key fields (two-column grid) */}
        <div style={gridStyle}>
          {priorityItems.map((it) => (
            <div key={it.label} style={itemStyle}>
              <div style={labelStyle}>{it.label}</div>
              <div style={valueStyle}>{it.value}</div>
            </div>
          ))}
        </div>

        {/* Collapsible advanced fields */}
        {advancedItems.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              style={{
                border: "1px solid #d1d5db",
                background: "#ffffff",
                color: "#374151",
                borderRadius: 8,
                padding: "8px 12px",
                cursor: "pointer",
              }}
            >
              {showAdvanced ? "Collapse more fields" : "Expand more fields"}
            </button>

            {showAdvanced && (
              <div>
                <div style={sectionTitleStyle}>More fields</div>
                <div style={{ ...gridStyle, gridTemplateColumns: "1fr 1fr" }}>
                  {advancedItems.map((it) => (
                    <div key={it.label} style={itemStyle}>
                      <div style={labelStyle}>{it.label}</div>
                      <div style={valueStyle}>{it.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}