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

export default function AdminPanelPage() {
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

  // Optional: read initial section from URL (?section=config / cost / access)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("section");
    if (fromUrl === "access" || fromUrl === "config" || fromUrl === "cost") {
      setActiveSection(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Optional: sync section to URL on change for refresh persistence
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("section", activeSection);
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", url);
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
            {activeSection === "config" && <AdminConfigPage />}
            {activeSection === "cost" && <AdminMetricsPage />}
          </div>
        )}
      </main>
    </div>
  );
}
