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

import React, { useState, useEffect } from "react";
import * as auth from "../../utils/auth";
import NoAccess from "./NoAccess";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import AdminUsersPage from "./AdminUsersPage";
import AdminConfigPage from "./AdminConfigPage";
import AdminMetricsPage from "./AdminMetricsPage";
import AdminKeywordConfigPage from "./AdminKeywordConfigPage";

function AdminPanelPage() {
  const role = auth.getRole?.();
  const loggedIn = auth.isLoggedIn?.();
  const username = auth.getUsername?.() || "Admin";

  // If not logged in, automatically redirect to login after 1.2s, with redirect back to current target
  React.useEffect(() => {
    if (!loggedIn) {
      const timer = setTimeout(() => {
        const redirect = encodeURIComponent(window.location.hash.slice(1) || "/admin-panel");
        window.location.hash = `#/admin-login?redirect=${redirect}`;
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [loggedIn]);

  // Left-side three-section state: "access" | "config" | "cost"
  const [activeSection, setActiveSection] = useState("access");

  // 初始化：从哈希读取 ?section= 参数，并确保哈希路由在 admin-panel
  useEffect(() => {
    const hash = window.location.hash || "#/admin-panel";
    const [pathPart, qs] = hash.slice(1).split("?");
    const params = new URLSearchParams(qs || "");
    const fromUrl = params.get("section");
    if (fromUrl === "access" || fromUrl === "model" || fromUrl === "config" || fromUrl === "cost") {
      setActiveSection(fromUrl);
    }
    // 若不是 admin-panel 路由，则纠正为 admin-panel，保留原查询参数
    if (`#/${pathPart || ""}` !== "#/admin-panel") {
      const newHash = `#/admin-panel${qs ? `?${qs}` : ""}`;
      window.location.hash = newHash;
    }
  }, []);

  // 同步：当 activeSection 变化时，把 section 写进哈希，刷新即可停留在当前页
  useEffect(() => {
    const hash = window.location.hash || "#/admin-panel";
    const [, qs] = hash.slice(1).split("?");
    const params = new URLSearchParams(qs || "");
    params.set("section", activeSection);
    const newHash = `#/admin-panel?${params.toString()}`;
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    }
  }, [activeSection]);

  const noAccess = !loggedIn || role !== "admin";

  return (
    <div style={{ display: "flex", background: "#f6f7fb", minHeight: "100vh" }}>
      <Sidebar active={activeSection} onSelect={setActiveSection} />
      <main style={{ flex: 1, padding: 16 }}>
        <Topbar username={username} />
        {noAccess ? (
          <NoAccess />
        ) : (
          <div style={{ flex: 1, paddingTop: 12 }}>
            {activeSection === "access" && <AdminUsersPage />}
            {activeSection === "model" && <AdminConfigPage />}
            {activeSection === "config" && <AdminKeywordConfigPage />}
            {activeSection === "cost" && <AdminMetricsPage />}
          </div>
        )}
      </main>
    </div>
  );
}
// Add missing default export for index.js default import
export default AdminPanelPage;
