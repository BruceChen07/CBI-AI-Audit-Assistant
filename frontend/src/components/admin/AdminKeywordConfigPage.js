// Keyword Highlight Configuration - Configuration Management subpage
// 功能：关键词与颜色映射的增删改查 + 本地持久化
import React, { useEffect, useState } from "react";
import { controlStyle, labelStyle, btnPrimary, btnSecondary, btnGhost } from "./styles/commonStyles";
import { apiFetch } from "../../utils/api";

const STORAGE_KEY = "keyword_color_configs";

function loadConfigs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConfigs(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

// 新增：安全调色板（Excel/Web安全、白底可读性高）
const SAFE_PALETTE = [
  // Neutrals (dark first)
  "#111827","#1F2937","#374151","#4B5563","#6B7280","#9CA3AF",
  // Blues
  "#1D4ED8","#2563EB","#3B82F6","#0EA5E9","#06B6D4",
  // Greens & Teals
  "#065F46","#047857","#10B981","#22C55E","#14B8A6",
  // Yellows / Oranges
  "#B45309","#D97706","#F59E0B","#EAB308","#F97316","#EA580C",
  // Reds / Roses
  "#B91C1C","#DC2626","#EF4444","#F43F5E",
  // Purples / Violets / Indigo
  "#4F46E5","#6366F1","#7C3AED","#8B5CF6","#9333EA","#D946EF",
  // Pinks
  "#EC4899","#DB2777"
];

// 调色板色块选择器
function SafeColorPicker({ value, onChange }) {
  const selected = String(value || "").toUpperCase();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 24px)", gap: 8 }}>
      {SAFE_PALETTE.map((c) => {
        const isSelected = selected === c.toUpperCase();
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            style={{
              width: 24, height: 24, borderRadius: 6,
              border: isSelected ? "2px solid #111827" : "1px solid #e5e7eb",
              background: c, cursor: "pointer"
            }}
            aria-label={c}
            title={c}
          />
        );
      })}
    </div>
  );
}

// 标准化为 #RRGGBB
function normalizeColor(value) {
  if (!value) return null;
  let v = String(value).trim();

  const hex6 = v.match(/^#?([0-9a-fA-F]{6})$/);
  if (hex6) return `#${hex6[1].toUpperCase()}`;

  const hex3 = v.match(/^#?([0-9a-fA-F]{3})$/);
  if (hex3) {
    const exp = hex3[1].split("").map((c) => c + c).join("");
    return `#${exp.toUpperCase()}`;
  }

  const rgb = v.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+\s*)?\)$/i);
  if (rgb) {
    const toHex = (n) => Math.min(255, Number(n)).toString(16).padStart(2, "0").toUpperCase();
    return `#${toHex(rgb[1])}${toHex(rgb[2])}${toHex(rgb[3])}`;
  }
  return null;
}

function isSafeColor(c) {
  const norm = normalizeColor(c);
  return !!norm && SAFE_PALETTE.includes(norm.toUpperCase());
}

export default function AdminKeywordConfigPage() {

  // 状态声明（必须位于组件函数体内）
    const [items, setItems] = useState([]);
    const [newKeyword, setNewKeyword] = useState("");
    const [newColor, setNewColor] = useState("#3b82f6");
    const [editingId, setEditingId] = useState(null);
    const [editDraft, setEditDraft] = useState({ keyword: "", color: "#000000" });
    const [banner, setBanner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newColorError, setNewColorError] = useState(null);
    const [editColorError, setEditColorError] = useState(null);
    // 安全调色板选择联动（新增，需在函数体内）
    const handleNewColorSelect = (c) => {
        const norm = normalizeColor(c);
        setNewColor(norm || c);
        setNewColorError(null);
    };
    const handleEditColorSelect = (c) => {
        const norm = normalizeColor(c);
        setEditDraft((d) => ({ ...d, color: norm || c }));
        setEditColorError(null);
    };

    const handleNewColorChange = (val) => {
      const norm = normalizeColor(val);
      if (norm) {
        setNewColor(norm);
        setNewColorError(null);
      } else {
        setNewColor(val);
        setNewColorError("Unsupported color. Use #RRGGBB/#RGB or rgb(r,g,b).");
      }
    };

    const handleEditColorChange = (val) => {
      const norm = normalizeColor(val);
      setEditDraft((d) => ({ ...d, color: norm || val }));
      setEditColorError(norm ? null : "Unsupported color. Use #RRGGBB/#RGB or rgb(r,g,b).");
    };

    useEffect(() => {
      (async () => {
        try {
          setLoading(true);
          const data = await apiFetch("/admin/keywords");
          setItems((data?.items || []).map((it) => ({ id: Date.now() + Math.random(), ...it })));
        } catch (err) {
          setBanner({ kind: "error", text: err?.detail || err?.message || "Failed to load keyword configs" });
        } finally {
          setLoading(false);
        }
      })();
    }, []);

    const persist = async (next) => {
      try {
        setSaving(true);
        setItems(next);
        const payload = { items: next.map(({ keyword, color }) => ({ keyword, color })) };
        await apiFetch("/admin/keywords", {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setBanner({ kind: "success", text: "Configuration saved" });
      } catch (err) {
        setBanner({ kind: "error", text: err?.detail || err?.message || "Failed to save configuration" });
      } finally {
        setSaving(false);
      }
    };

    const addItem = () => {
      const kw = String(newKeyword || "").trim();
      if (!kw) {
        setBanner({ kind: "error", text: "Keyword cannot be empty" });
        return;
      }
      if (items.some((i) => i.keyword.toLowerCase() === kw.toLowerCase())) {
        setBanner({ kind: "error", text: "Keyword already exists" });
        return;
      }
      if (!isSafeColor(newColor)) {
        setBanner({ kind: "error", text: "Please pick a color from the palette" });
        setNewColorError("Pick a color from the palette");
        return;
      }
      const id = Date.now();
      const next = [...items, { id, keyword: kw, color: normalizeColor(newColor) }];
      setNewKeyword("");
      setNewColor("#3b82f6");
      setNewColorError(null);
      persist(next);
    };

    const commitEdit = () => {
      const kw = String(editDraft.keyword || "").trim();
      if (!kw) {
        setBanner({ kind: "error", text: "Keyword cannot be empty" });
        return;
      }
      if (!isSafeColor(editDraft.color)) {
        setEditColorError("Pick a color from the palette");
        setBanner({ kind: "error", text: "Please pick a color from the palette" });
        return;
      }
      const next = items.map((i) =>
        i.id === editingId ? { ...i, keyword: kw, color: normalizeColor(editDraft.color) } : i
      );
      setEditingId(null);
      setEditColorError(null);
      persist(next);
    };

    const deleteItem = (id) => {
      const next = items.filter((i) => i.id !== id);
      persist(next);
    };

    const startEdit = (it) => {
      setEditingId(it.id);
      setEditDraft({ keyword: it.keyword, color: it.color });
    };

    const cancelEdit = () => {
      setEditingId(null);
      setEditDraft({ keyword: "", color: "#000000" });
    };

    const cardStyle = {
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      boxShadow: "0 1px 2px rgba(16,24,40,.06)",
      padding: 16,
    };
    const headerStyle = {
      paddingBottom: 12,
      borderBottom: "1px solid #eef2f6",
      fontSize: 16,
      fontWeight: 600,
      color: "#111827",
      marginBottom: 12,
    };
    const colorSwatch = (c) => ({
      width: 28,
      height: 18,
      borderRadius: 4,
      border: "1px solid #e5e7eb",
      background: c || "#000000",
    });

    return (
      <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
        <div style={cardStyle}>
          <div style={headerStyle}>Keyword Highlight Configuration</div>
    
          {/* Add keyword row */}
          <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 2fr) minmax(280px, 1.5fr) auto", gap: 12, alignItems: "end", gridAutoRows: "minmax(72px, auto)" }}>
            <div>
              <label style={labelStyle}>Keyword</label>
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="e.g., risk, evidence, compliance"
                style={{ ...controlStyle }}
              />
            </div>
            <div>
              <label style={labelStyle}>Color</label>
              <>
                <SafeColorPicker value={newColor} onChange={handleNewColorSelect} />
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                  <input
                    type="text"
                    value={normalizeColor(newColor) || ""}
                    readOnly
                    style={{ ...controlStyle, width: 120, minWidth: 120, background: "transparent" }}
                  />
                  <div style={colorSwatch(normalizeColor(newColor) || newColor)} />
                </div>
                {newColorError && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }}>{newColorError}</div>}
              </>
            </div>
            <div style={{ display: "flex", alignItems: "end" }}>
              <button
                type="button"
                onClick={addItem}
                style={btnPrimary}
                disabled={!isSafeColor(newColor) || saving}
              >
                Add Keyword
              </button>
            </div>
          </div>
    
          {/* List */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: "#374151" }}>Added Keywords</div>
            {items.length === 0 ? (
              <div style={{ fontSize: 13, color: "#6b7280" }}>No configuration yet. Please add a keyword.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {items.map((it) => {
                  const isEditing = editingId === it.id;
                  return (
                    <div
                      key={it.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(280px, 2fr) minmax(220px, 1fr) auto",
                        gap: 12,
                        alignItems: "start",
                        padding: 8,
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        background: "#fff",
                      }}
                    >
                      {/* keyword */}
                      <div>
                        <label style={labelStyle}>Keyword</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editDraft.keyword}
                            onChange={(e) => setEditDraft((d) => ({ ...d, keyword: e.target.value }))}
                            style={controlStyle}
                          />
                        ) : (
                          <div style={{ ...controlStyle, background: "transparent", border: "1px dashed #e5e7eb" }}>
                            {it.keyword}
                          </div>
                        )}
                      </div>
    
                      {/* color */}
                      <div>
                        <label style={labelStyle}>Color</label>
                        {isEditing ? (
                          <>
                            <SafeColorPicker value={editDraft.color} onChange={handleEditColorSelect} />
                            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                              <input
                                type="text"
                                value={normalizeColor(editDraft.color) || ""}
                                readOnly
                                style={{ ...controlStyle, width: 120, minWidth: 120, background: "transparent" }}
                              />
                              <div style={colorSwatch(normalizeColor(editDraft.color) || editDraft.color)} />
                            </div>
                            {editColorError && (
                              <div style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }}>
                                {editColorError}
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            <div style={colorSwatch(it.color)} />
                            <div style={{ fontSize: 12, color: "#6b7280", wordBreak: "break-all" }}>{it.color}</div>
                          </div>
                        )}
                      </div>
    
                      {/* actions */}
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {isEditing ? (
                          <>
                            <button
                              style={btnPrimary}
                              onClick={commitEdit}
                              disabled={!isSafeColor(editDraft.color) || saving}
                            >
                              Save
                            </button>
                            <button style={btnGhost} onClick={cancelEdit}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button style={btnSecondary} onClick={() => startEdit(it)}>
                              Edit
                            </button>
                            <button style={btnGhost} onClick={() => deleteItem(it.id)}>
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
}
   