// 文件顶部（引入封装好的 API）
import { apiFetch } from "../utils/api";
import { getEvents, clearEvents, setLevel, info } from "../utils/logger";

function AdminKeywordConfigPage() {
    // 后端持久化：读取（使用统一的 apiFetch）
    async function loadConfigs() {
        const data = await apiFetch("/admin/keywords");
        info("Load keyword configs from backend", { count: (data.items || []).length }); // 新增：记录加载条数
        setItems(data.items || []);
        setBanner({ type: "success", message: "Loaded keyword configs." });
    }

    // 后端持久化：保存（使用统一的 apiFetch）
    async function persist(nextItems) {
        const payload = {
            items: (nextItems || items).map(it => ({
                keyword: String(it.keyword || "").trim(),
                color: String(it.color || "#FF0000").toUpperCase().startsWith("#")
                    ? String(it.color || "#FF0000").toUpperCase()
                    : `#${String(it.color || "FF0000").toUpperCase()}`
            }))
        };
        info("Persist keyword configs", { items: payload.items }); // 新增：记录保存的关键词与颜色
        setSaving(true);
        try {
            const data = await apiFetch("/admin/keywords", {
                method: "PUT",
                body: JSON.stringify(payload),
            });
            setItems(data.items || []);
            setBanner({ type: "success", message: "Saved keyword configs." });
        } catch (e) {
            setBanner({ type: "error", message: String(e.message || e) });
        } finally {
            setSaving(false);
        }
    }

    // 页面挂载时拉取后端已保存配置
    useEffect(() => {
        loadConfigs().catch(e => {
            setBanner({ type: "error", message: `Load failed: ${String(e.message || e)}` });
        });
    }, []);

    // 新增关键字时，先更新本地，再持久化
    function addItem() {
        const next = [...items, { keyword: newKeyword.trim(), color: newColor.trim() }];
        setItems(next);
        setNewKeyword("");
        // 关键点：持久化
        persist(next);
        setEditingId(null);
        setEditingId(null);
    }

    // 提交编辑时，更新后持久化
    function commitEdit() {
        const next = items.map(it => it.keyword === editDraft.keyword ? editDraft : it);
        setItems(next);
        setEditingId(null);
        // 关键点：持久化
        persist(next);
        setEditingId(null);
    }

    // 删除关键字后，更新并持久化
    function deleteItem(keyword) {
        const next = items.filter(it => it.keyword !== keyword);
        setItems(next);
        // 关键点：持久化
        persist(next);
        setEditingId(null);
    }

    // 简易日志面板（最后渲染处附近插入）
    const events = getEvents();
    const LogsPanel = (
        <div style={{ marginTop: 12, border: "1px solid #ddd", borderRadius: 6, padding: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => clearEvents()}>清除日志</button>
                <button onClick={() => setLevel("debug")}>级别: DEBUG</button>
                <button onClick={() => setLevel("info")}>级别: INFO</button>
            </div>
            <div style={{ maxHeight: 180, overflow: "auto", fontFamily: "monospace", fontSize: 12, marginTop: 8 }}>
                {events.slice(-50).reverse().map((e, idx) => (
                    <div key={idx}>
                        {e.ts} [{e.level}] {e.type} - {e.message}
                    </div>
                ))}
            </div>
        </div>
    );
}