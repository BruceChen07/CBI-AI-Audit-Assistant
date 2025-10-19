import os
import json
import time
import requests

BASE = os.environ.get("API_BASE", "http://localhost:8000")
ADMIN_USER = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASS = os.environ.get("ADMIN_PASSWORD", "admin123")

def pretty(obj):
    return json.dumps(obj, ensure_ascii=False, indent=2)

def main():
    print(f"[INFO] BASE={BASE}")

    # 1) login
    r = requests.post(f"{BASE}/auth/login", json={"username": ADMIN_USER, "password": ADMIN_PASS})
    r.raise_for_status()
    data = r.json()
    token = data["access_token"]
    print("[OK] login")

    headers = {"Authorization": f"Bearer {token}"}

    # 2) refresh
    r = requests.post(f"{BASE}/auth/refresh", headers=headers)
    r.raise_for_status()
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[OK] refresh")

    # 3) get config
    r = requests.get(f"{BASE}/admin/config", headers=headers)
    r.raise_for_status()
    print("[OK] get config:", pretty(r.json()))

    # 4) metrics (may be empty)
    r = requests.get(f"{BASE}/admin/metrics/tokens?group_by=date", headers=headers)
    r.raise_for_status()
    print("[OK] metrics by date:", pretty(r.json()))

    print("[DONE] smoke tests passed.")

if __name__ == "__main__":
    main()