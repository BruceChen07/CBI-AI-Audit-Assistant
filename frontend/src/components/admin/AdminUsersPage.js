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

import React, { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";
import { controlStyle, labelStyle, btnPrimary, btnSecondary } from "./styles/commonStyles";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // create form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [isActive, setIsActive] = useState(true);

  // Unified disabled condition to easily reuse styles
  const disabledCreate = (busy || !username || !password || password.length < 6);
  const actionBtnStyle = (disabled) => ({
    ...btnSecondary,
    padding: "6px 12px",
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
  });

  const refresh = async () => {
    setError("");
    try {
      const resp = await apiFetch("/admin/users");
      setUsers(resp.users || []);
    } catch (e) {
      setError(e.message || "Load users failed");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiFetch("/admin/users", {
        method: "POST",
        body: JSON.stringify({ username, password, role, is_active: isActive }),
      });
      setUsername("");
      setPassword("");
      setRole("user");
      setIsActive(true);
      await refresh();
    } catch (e) {
      setError(e.message || "Create user failed");
    } finally {
      setBusy(false);
    }
  };

  const onToggleRole = async (u) => {
    setBusy(true);
    setError("");
    try {
      const newRole = u.role === "admin" ? "user" : "admin";
      await apiFetch(`/admin/users/${u.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      await refresh();
    } catch (e) {
      setError(e.message || "Update role failed");
    } finally {
      setBusy(false);
    }
  };

  const onToggleActive = async (u) => {
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/admin/users/${u.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !u.is_active }),
      });
      await refresh();
    } catch (e) {
      setError(e.message || "Update active failed");
    } finally {
      setBusy(false);
    }
  };

  const onResetPassword = async (u) => {
    const pwd = prompt(`Reset password for ${u.username}: Enter new password (min 6 chars)`);
    if (!pwd) return;
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/admin/users/${u.id}`, {
        method: "PATCH",
        body: JSON.stringify({ password: pwd }),
      });
      alert("Password reset successfully.");
    } catch (e) {
      setError(e.message || "Reset password failed");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (u) => {
    if (!window.confirm(`Delete user ${u.username}?`)) return;
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/admin/users/${u.id}`, { method: "DELETE" });
      await refresh();
    } catch (e) {
      setError(e.message || "Delete user failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Users</h3>
      <form onSubmit={onCreate} style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 8 }}>
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={busy}
            style={controlStyle}
          />
          <input
            type="password"
            placeholder="Password (>=6)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
            style={controlStyle}
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={busy}
            style={controlStyle}
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 6, ...labelStyle, margin: 0 }}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={busy}
              style={{ transform: "translateY(1px)" }}
            />
            Active
          </label>
          <button
            type="submit"
            disabled={disabledCreate}
            style={{
              ...btnPrimary,
              opacity: disabledCreate ? 0.6 : 1,
              cursor: disabledCreate ? "not-allowed" : "pointer",
            }}
          >
            Create
          </button>
        </div>
      </form>

      {error && <div style={{ color: "#ff6b6b", marginBottom: 10 }}>{error}</div>}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: 60 }}>ID</th>
              <th>Username</th>
              <th>Role</th>
              <th>Active</th>
              <th style={{ width: 420 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(users || []).map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>{u.role}</td>
                <td>{String(u.is_active)}</td>
                <td style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => onToggleRole(u)}
                    disabled={busy}
                    style={actionBtnStyle(busy)}
                  >
                    To {u.role === "admin" ? "user" : "admin"}
                  </button>
                  <button
                    onClick={() => onToggleActive(u)}
                    disabled={busy}
                    style={actionBtnStyle(busy)}
                  >
                    {u.is_active ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => onResetPassword(u)}
                    disabled={busy}
                    style={actionBtnStyle(busy)}
                  >
                    Reset Password
                  </button>
                  <button
                    onClick={() => onDelete(u)}
                    disabled={busy}
                    style={actionBtnStyle(busy)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "#a0aec0" }}>
                  No users.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}