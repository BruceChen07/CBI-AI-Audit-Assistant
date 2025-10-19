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
import { fmtUsd2 } from '../utils/formatters';

export default function MetricsTable({ rows, groupBy }) {
  return (
    <div className="table-container">
      <table>
        <thead>
          {groupBy === "model" ? (
            <tr>
              <th>Model</th>
              <th>Input Tokens</th>
              <th>Output Tokens</th>
              <th>Cost</th>
            </tr>
          ) : (
            <tr>
              <th>Date</th>
              <th>Input Tokens</th>
              <th>Output Tokens</th>
              <th>Cost</th>
            </tr>
          )}
        </thead>
        <tbody>
          {(rows || []).map((r, idx) =>
            groupBy === "model" ? (
              <tr key={r.model || idx}>
                <td>{r.model}</td>
                <td>{r.input_tokens}</td>
                <td>{r.output_tokens}</td>
                <td>{fmtUsd2(r.cost)}</td>
              </tr>
            ) : (
              <tr key={r.date || idx}>
                <td>{r.date}</td>
                <td>{r.input_tokens}</td>
                <td>{r.output_tokens}</td>
                <td>{fmtUsd2(r.cost)}</td>
              </tr>
            )
          )}
          {!rows || rows.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: "center", color: "#a0aec0" }}>
                No data.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}