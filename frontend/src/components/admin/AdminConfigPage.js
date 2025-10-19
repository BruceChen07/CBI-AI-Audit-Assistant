import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { apiFetch } from "../../utils/api";
import SettingsForm from "./components/SettingsForm";
import ModelCatalog from "./components/ModelCatalog";
import PromptConfig from "./components/PromptConfig";
import ModelDetailsEditor from "./components/ModelDetailsEditor";

export default function AdminConfigPage() {
  const [cfg, setCfg] = useState({ temperature: 1.0, model: "", pricing_model: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialCfg, setInitialCfg] = useState(null);
  const [warnings, setWarnings] = useState({});
  const [catalogCols, setCatalogCols] = useState([]);
  const [catalogRows, setCatalogRows] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");

  // Validation logic
  const validate = (next) => {
    const e = {};
    const t = Number(next.temperature);
    if (!Number.isFinite(t) || t < 0 || t > 1) {
      e.temperature = "Temperature must be a number between 0 and 1.";
    }
    if (!String(next.model || "").trim()) {
      e.model = "Model is required.";
    }
    return e;
  };

  // Compute warnings
  const computeWarnings = useCallback((next) => {
    const w = {};
    const pm = String(next.pricing_model || "").trim();
    if (pm) {
      const looksLikePreset = /^[\w.-]+$/.test(pm);
      const looksLikeCsv = /\.csv$/i.test(pm);
      const looksLikePath = /^[a-zA-Z]:\\/.test(pm) || pm.startsWith("/") || pm.includes("\\") || pm.includes("/");
      if (!(looksLikePreset || looksLikeCsv || looksLikePath)) {
        w.pricing_model = "This value doesn’t look like a preset name or a CSV path. It will be submitted to the backend as-is after saving.";
      } else if (!looksLikeCsv && looksLikePath) {
        w.pricing_model = "Path detected. It is recommended to use a .csv file for best compatibility.";
      }
    }
    return w;
  }, []);

  // Event handlers
  const onChangeField = useCallback((patch) => {
    setCfg((prev) => {
      const next = { ...prev, ...patch };
      setErrors(validate(next));
      setWarnings(computeWarnings(next));
      return next;
    });
  }, [computeWarnings]);

  const onSave = useCallback(async (e) => {
    e.preventDefault();
    const currentErrors = validate(cfg);
    setErrors(currentErrors);
    if (Object.keys(currentErrors).length > 0) return;
    
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const body = {
        temperature: Number(cfg.temperature),
        model: String(cfg.model || ""),
        pricing_model: String(cfg.pricing_model || ""),
      };
      const resp = await apiFetch("/admin/config", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      setCfg(resp);
      setInitialCfg(resp);
      setWarnings(computeWarnings(resp));
      setSaved(true);
    } catch (e) {
      setError(e?.detail || e?.message || "Save config failed");
    } finally {
      setBusy(false);
    }
  }, [cfg, computeWarnings]);

  const onReload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await apiFetch("/admin/config");
      setCfg(resp);
      setInitialCfg(resp);
      setErrors({});
      setWarnings(computeWarnings(resp));
    } catch (e) {
      setError(e?.detail || e?.message || "Load config failed");
    } finally {
      setLoading(false);
    }
  }, [computeWarnings]);

  const onReset = useCallback(() => {
    if (initialCfg) {
      setCfg(initialCfg);
      setErrors({});
      setWarnings(computeWarnings(initialCfg));
    }
  }, [initialCfg, computeWarnings]);

  const onReloadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError("");
    try {
      const resp = await apiFetch("/admin/model-catalog"); // Updated: use /admin/model-catalog instead of /admin/models
      setCatalogCols(resp.columns || []);
      setCatalogRows(resp.rows || []);
    } catch (e) {
      setCatalogError(e?.detail || e?.message || "Load catalog failed");
    } finally {
      setCatalogLoading(false);
    }
  }, [setCatalogLoading, setCatalogError]);

  // Derived state
  const dirty = initialCfg != null && JSON.stringify(cfg) !== JSON.stringify(initialCfg);
  
  const modelCol = useMemo(() => {
    const cols = catalogCols || [];
    return cols.find((c) => /^(model\s*name|model)$/i.test(c)) || cols.find((c) => /name/i.test(c)) || null;
  }, [catalogCols]);

  const modelOptions = useMemo(() => {
    if (!modelCol) return [];
    const vals = Array.from(
      new Set(
        (catalogRows || [])
          .map((r) => String(r?.[modelCol] ?? "").trim())
          .filter(Boolean)
      )
    );
    return vals.sort((a, b) => a.localeCompare(b));
  }, [catalogRows, modelCol]);

  const selectedRow = useMemo(() => {
    if (!modelCol || !cfg?.model) return null;
    const key = String(cfg.model).trim().toLowerCase();
    return (
      (catalogRows || []).find(
        (r) => String(r?.[modelCol] ?? "").trim().toLowerCase() === key
      ) || null
    );
  }, [catalogRows, modelCol, cfg?.model]);

  const getByPattern = useCallback(
    (row, regex) => {
      if (!row) return "";
      const col = (catalogCols || []).find((c) => regex.test(c));
      return col ? String(row?.[col] ?? "") : "";
    },
    [catalogCols]
  );

  // Initialization
  useEffect(() => {
    onReload();
    onReloadCatalog();
  }, [onReload, onReloadCatalog]);

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      <SettingsForm
        cfg={cfg}
        onChangeField={onChangeField}
        onSave={onSave}
        onReload={onReload}
        onReset={onReset}
        busy={busy}
        error={error}
        saved={saved}
        loading={loading}
        errors={errors}
        warnings={warnings}
        dirty={dirty}
        modelOptions={modelOptions}
        selectedRow={selectedRow}
        getByPattern={getByPattern}
      />
      
      <div style={{ marginTop: 40 }}>
        <ModelCatalog
          columns={catalogCols}
          rows={catalogRows}
          selectedRow={selectedRow}
          title="Current Model Details"
        />
        <ModelDetailsEditor />
        <PromptConfig />
      </div>
    </div>
  );
}