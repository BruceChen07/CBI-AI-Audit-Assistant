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
import { isLoggedIn, getRole, getUsername, onAuthChange, logout } from "../utils/auth";

const containerStyle = {
  position: "absolute",
  top: 12,
  right: 16,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

export default function AdminMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Refresh local state when login/logout happens elsewhere (e.g., 401 auto logout)
    const unsub = onAuthChange(() => setOpen((v) => !v));
    return unsub;
  }, []);

  const [session, setSession] = useState({
    logged: isLoggedIn(),
    role: getRole(),
    username: getUsername(),
  });

  useEffect(() => {
    // Refresh session when login/logout or other changes occur
    const unsub = onAuthChange(() => {
      setSession({
        logged: isLoggedIn(),
        role: getRole(),
        username: getUsername(),
      });
    });
    return unsub;
  }, []);

  const isAdmin = session.logged && session.role === "admin";

  const handleOpenAdminPanel = () => {
    const url = `${window.location.origin}${window.location.pathname}#/admin-panel`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleLoginClick = () => {
    const url = `${window.location.origin}${window.location.pathname}#/admin-panel`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleLogout = () => {
    logout();
    // Refresh the menu display immediately
    setSession({
      logged: isLoggedIn(),
      role: getRole(),
      username: getUsername(),
    });
  };

  return (
    <div style={containerStyle}>
      {!session.logged ? (
        <button onClick={handleLoginClick}>Admin</button>
      ) : (
        <>
          <span style={{ fontSize: 14 }}>
            Hello, {session.username} ({session.role})
          </span>
          {isAdmin && (
            <button onClick={handleOpenAdminPanel} title="Open Admin Panel">
              Admin Panel
            </button>
          )}
          <button onClick={handleLogout} title="Logout">
            Logout
          </button>
        </>
      )}

      {/* Modal-based login has been deprecated */}
    </div>
  );
}