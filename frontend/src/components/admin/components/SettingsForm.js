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
import { controlStyle, labelStyle, btnBase, btnPrimary, btnSecondary, btnGhost } from '../styles/commonStyles';
import { validateConfig, computeWarnings } from '../utils/validators';
import { apiFetch } from '../../../utils/api';

export default function SettingsForm({
    cfg,
    onChangeField,
    onSave,
    onReload,
    onReset,
    busy,
    error,
    saved,
    loading,
    errors,
    warnings,
    dirty,
    modelOptions,
    selectedRow,
    getByPattern,
}) {
    const [useCustomModel, setUseCustomModel] = React.useState(false);
    const [customModel, setCustomModel] = React.useState('');

    // local editable cost fields
    const [inputCostLocal, setInputCostLocal] = React.useState('');
    const [outputCostLocal, setOutputCostLocal] = React.useState('');

    const initCostFromRow = React.useCallback((row) => {
        const inCost = getByPattern(row, /input\s*cost/i) || '';
        const outCost = getByPattern(row, /output\s*cost/i) || '';
        setInputCostLocal(inCost);
        setOutputCostLocal(outCost);
    }, [getByPattern]);

    React.useEffect(() => {
        initCostFromRow(selectedRow);
    }, [selectedRow, initCostFromRow]);

    // Rename to avoid collision with state variable
    const applyCustomModel = async () => {
        const name = (customModel || '').trim();
        if (!name) return;
        const res = await fetch('/admin/config', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: name }),
        });
        if (res.ok) {
            if (typeof onSave === 'function') onSave();
        }
    };

    // unified submit handler — save config + cost overrides
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (typeof onSave === 'function') {
            await onSave(e);
        }
        const modelName = String(cfg?.model || '').trim();
        if (modelName) {
            await apiFetch(`/admin/model-details?model=${encodeURIComponent(modelName)}`, {
                method: 'PUT',
                body: JSON.stringify({
                    fields: {
                        'Input Cost (1M Tokens)': inputCostLocal,
                        'Output Cost (1M Tokens)': outputCostLocal,
                    },
                }),
            });
        }
    };

    return (
        <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16, color: "#1a202c" }}>Settings</h3>
            {/* Omitted: top banner rendering */}
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, maxWidth: 500 }}>
                <label style={{ textAlign: "left" }}>
                    Temperature (0.0 - 1.0)
                    <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        value={cfg.temperature || ''}
                        onChange={(e) => onChangeField({ temperature: parseFloat(e.target.value) || 0 })}
                        disabled={busy || loading}
                        style={{ ...controlStyle, borderColor: errors.temperature ? "#ff6b6b" : "#cbd5e1" }}
                    />
                </label>

                {/* Omitted: Model selection block */}

                <label style={{ textAlign: "left" }}>
                    Input Cost (1M Tokens)
                    <input
                        type="text"
                        value={inputCostLocal}
                        onChange={(e) => setInputCostLocal(e.target.value)}
                        disabled={busy || loading}
                        style={controlStyle}
                        placeholder="e.g., $0.50"
                    />
                    <div style={{ fontSize: 12, color: "#6c757d", marginTop: 4 }}>
                        Editable — saved as model override
                    </div>
                </label>

                <label style={{ textAlign: "left" }}>
                    Output Cost (1M Tokens)
                    <input
                        type="text"
                        value={outputCostLocal}
                        onChange={(e) => setOutputCostLocal(e.target.value)}
                        disabled={busy || loading}
                        style={controlStyle}
                        placeholder="e.g., $8"
                    />
                    <div style={{ fontSize: 12, color: "#6c757d", marginTop: 4 }}>
                        Editable — saved as model override
                    </div>
                </label>

                {/* Omitted: button section */}
            </form>
            <div style={controlStyle}>
                <label style={labelStyle}>Custom Model Name</label>
                <input type="text" value={customModel} onChange={e => setCustomModel(e.target.value)} placeholder="e.g. GPT-4.1-custom" />
                <button style={btnSecondary} onClick={applyCustomModel}>Use This Model</button>
            </div>
        </div>
    );
}