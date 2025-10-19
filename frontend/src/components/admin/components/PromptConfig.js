import React, { useEffect, useState } from "react";
import { apiFetch } from "../../../utils/api";
import { controlStyle, btnPrimary, btnSecondary } from "../styles/commonStyles";

export default function PromptConfig() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [config, setConfig] = useState({
        prompt_mode: "type_specific",
        prompt_hint: "",
        prompt_aet: "",
        prompt_general: ""
    });

    // Unified light card style (aligned with ModelCatalog)
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
    const bodyStyle = { padding: 16 };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError("");
            setSuccess("");
            try {
                const data = await apiFetch("/admin/prompts");
                setConfig(data);
            } catch (err) {
                setError(err?.detail || err?.message || "Failed to load prompt configuration");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const onChange = (patch) => setConfig((prev) => ({ ...prev, ...patch }));

    const save = async () => {
        setSaving(true);
        setError("");
        setSuccess("");
        try {
            const data = await apiFetch("/admin/prompts", {
                method: "PUT",
                body: JSON.stringify(config),
            });
            setConfig(data);
            setSuccess("Prompts saved successfully.");
        } catch (err) {
            setError(err?.detail || err?.message || "Failed to save prompt configuration");
        } finally {
            setSaving(false);
        }
    };

    const reload = async () => {
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            const data = await apiFetch("/admin/prompts");
            setConfig(data);
            setSuccess("Configuration reloaded.");
        } catch (err) {
            setError(err?.detail || err?.message || "Failed to reload prompt configuration");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ ...cardStyle, marginTop: 24 }}>
            <div style={headerStyle}>Prompt Configuration</div>
            <div style={bodyStyle}>
                {error && (
                    <div style={{
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 16,
                        color: "#dc2626",
                        fontSize: 14
                    }}>
                        • {error}
                    </div>
                )}
                {success && (
                    <div style={{
                        background: "#ecfdf5",
                        border: "1px solid #a7f3d0",
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 16,
                        color: "#065f46",
                        fontSize: 14
                    }}>
                        ✓ {success}
                    </div>
                )}

                <label style={{ textAlign: "left", display: "block", marginBottom: 12 }}>
                    Mode
                    <select
                        value={config.prompt_mode}
                        onChange={(e) => onChange({ prompt_mode: e.target.value })}
                        style={controlStyle}
                    >
                        <option value="type_specific">Use type-specific prompts (Hint/AET)</option>
                        <option value="general_only">Use General Prompt for all queries</option>
                        <option value="fallback_general">Prefer type-specific; fallback to General when missing</option>
                    </select>
                </label>

                <label style={{ textAlign: "left", display: "block", marginBottom: 12 }}>
                    Hint Prompt
                    <textarea
                        rows={6}
                        value={config.prompt_hint}
                        onChange={(e) => onChange({ prompt_hint: e.target.value })}
                        style={{ ...controlStyle, fontFamily: "monospace", minHeight: 120 }}
                        placeholder="Write the system prompt for Hint analysis"
                    />
                </label>

                <label style={{ textAlign: "left", display: "block", marginBottom: 12 }}>
                    AET Prompt
                    <textarea
                        rows={6}
                        value={config.prompt_aet}
                        onChange={(e) => onChange({ prompt_aet: e.target.value })}
                        style={{ ...controlStyle, fontFamily: "monospace", minHeight: 120 }}
                        placeholder="Write the system prompt for AET analysis"
                    />
                </label>

                <label style={{ textAlign: "left", display: "block", marginBottom: 12 }}>
                    General Prompt
                    <textarea
                        rows={6}
                        value={config.prompt_general}
                        onChange={(e) => onChange({ prompt_general: e.target.value })}
                        style={{ ...controlStyle, fontFamily: "monospace", minHeight: 120 }}
                        placeholder="Write the general system prompt (used for all queries when selected)"
                    />
                </label>

                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button type="button" onClick={save} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.8 : 1 }}>
                        {saving ? "Saving..." : "Save"}
                    </button>
                    <button type="button" onClick={reload} disabled={saving} style={btnSecondary}>
                        Reload
                    </button>
                </div>

                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 12 }}>
                    Note: The system automatically appends strict constraints (e.g., “do not include inline citations or page numbers”).
                    If your prompt conflicts, system constraints still apply; answers are cleaned to ensure consistency.
                </div>
            </div>
        </div>
    );
}