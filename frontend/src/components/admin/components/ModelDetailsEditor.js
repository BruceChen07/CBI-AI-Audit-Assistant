import React, { useEffect, useState } from 'react';
import { controlStyle, labelStyle, btnPrimary, btnSecondary, btnGhost } from '../styles/commonStyles';

function Banner({ kind = 'info', text }) {
    const colors = {
        success: { background: '#e6ffed', border: '#2ecc71', color: '#2e7d32' },
        error:   { background: '#ffebee', border: '#e74c3c', color: '#c62828' },
        info:    { background: '#eef6ff', border: '#3498db', color: '#1d4ed8' },
    }[kind] || { background: '#eef6ff', border: '#3498db', color: '#1d4ed8' };

    return (
        <div style={{ padding: '8px 12px', marginBottom: 12, border: `1px solid ${colors.border}`, borderRadius: 6, background: colors.background, color: colors.color }}>
            {text}
        </div>
    );
}

export default function ModelDetailsEditor() {
    const [modelName, setModelName] = useState('');
    const [columns, setColumns] = useState([]);
    const [fields, setFields] = useState({});
    const [newKey, setNewKey] = useState('');
    const [newVal, setNewVal] = useState('');
    const [loading, setLoading] = useState(false);
    const [banner, setBanner] = useState(null);

    // Init: preload current model from config
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/admin/config');
                if (!res.ok) return;
                const cfg = await res.json();
                if (cfg && cfg.model) setModelName(cfg.model);
            } catch {}
        })();
    }, []);

    const loadDetails = async () => {
        if (!modelName.trim()) {
            setBanner({ kind: 'error', text: 'Please enter a model name.' });
            return;
        }
        setLoading(true);
        setBanner(null);
        try {
            const res = await fetch(`/admin/model-details?model=${encodeURIComponent(modelName)}`);
            const data = await res.json();
            setColumns(data.columns || []);
            setFields(data.fields || {});
            setBanner({ kind: 'success', text: 'Model details loaded.' });
        } catch (e) {
            setBanner({ kind: 'error', text: `Failed to load details: ${e}` });
        } finally {
            setLoading(false);
        }
    };

    const saveOverride = async () => {
        if (!modelName.trim()) {
            setBanner({ kind: 'error', text: 'Model name is required.' });
            return;
        }
        setLoading(true);
        setBanner(null);
        try {
            const res = await fetch(`/admin/model-details?model=${encodeURIComponent(modelName)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fields }),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.detail || `HTTP ${res.status}`);
            }
            await loadDetails();
            setBanner({ kind: 'success', text: 'Override saved.' });
        } catch (e) {
            setBanner({ kind: 'error', text: `Failed to save: ${e.message || e}` });
        } finally {
            setLoading(false);
        }
    };

    const deleteOverride = async () => {
        if (!modelName.trim()) return;
        setLoading(true);
        setBanner(null);
        try {
            const res = await fetch(`/admin/model-details?model=${encodeURIComponent(modelName)}`, { method: 'DELETE' });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.detail || `HTTP ${res.status}`);
            }
            await loadDetails();
            setBanner({ kind: 'success', text: 'Override deleted.' });
        } catch (e) {
            setBanner({ kind: 'error', text: `Failed to delete: ${e.message || e}` });
        } finally {
            setLoading(false);
        }
    };

    const useThisModel = async () => {
        if (!modelName.trim()) {
            setBanner({ kind: 'error', text: 'Model name is required.' });
            return;
        }
        setLoading(true);
        setBanner(null);
        try {
            const res = await fetch('/admin/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: modelName }),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.detail || `HTTP ${res.status}`);
            }
            setBanner({ kind: 'success', text: 'Current model updated.' });
        } catch (e) {
            setBanner({ kind: 'error', text: `Failed to update current model: ${e.message || e}` });
        } finally {
            setLoading(false);
        }
    };

    const addField = () => {
        const k = (newKey || '').trim();
        if (!k) {
            setBanner({ kind: 'error', text: 'Field key cannot be empty.' });
            return;
        }
        setFields(prev => ({ ...prev, [k]: newVal }));
        if (!columns.includes(k)) setColumns([...columns, k]);
        setNewKey('');
        setNewVal('');
    };

    const updateField = (k, v) => {
        setFields(prev => ({ ...prev, [k]: v }));
    };

    const cardStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, marginTop: 16 };
    const headerStyle = { fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#111827' };
    const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };

    return (
        <div style={cardStyle}>
            <div style={headerStyle}>Model Details Editor</div>
            {banner && <Banner kind={banner.kind} text={banner.text} />}

            <div style={controlStyle}>
                <label style={labelStyle}>Model Name</label>
                <input type="text" value={modelName} onChange={e => setModelName(e.target.value)} placeholder="e.g. GPT-4.1-custom" />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button style={btnSecondary} onClick={loadDetails} disabled={loading}>Load</button>
                    <button style={btnPrimary} onClick={useThisModel} disabled={loading}>Use This Model</button>
                    <button style={btnGhost} onClick={deleteOverride} disabled={loading}>Delete Override</button>
                </div>
            </div>

            <div style={{ ...controlStyle, marginTop: 12 }}>
                <label style={labelStyle}>Add Field</label>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input type="text" value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="Field key" />
                    <input type="text" value={newVal} onChange={e => setNewVal(e.target.value)} placeholder="Field value" />
                    <button style={btnSecondary} onClick={addField}>Add</button>
                </div>
            </div>

            <div style={{ ...gridStyle, marginTop: 12 }}>
                {(columns.length ? columns : Object.keys(fields || {})).map(k => (
                    <div key={k} style={controlStyle}>
                        <label style={labelStyle}>{k}</label>
                        {String(k).toLowerCase().match(/capabilities|use\s*case|description/) ? (
                            <textarea value={fields[k] ?? ''} onChange={e => updateField(k, e.target.value)} rows={4} />
                        ) : (
                            <input type="text" value={fields[k] ?? ''} onChange={e => updateField(k, e.target.value)} />
                        )}
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button style={btnPrimary} onClick={saveOverride} disabled={loading}>Save Override</button>
                <button style={btnGhost} onClick={loadDetails} disabled={loading}>Reload</button>
            </div>
        </div>
    );
}