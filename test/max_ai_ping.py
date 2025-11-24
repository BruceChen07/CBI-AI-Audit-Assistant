import os
import sys
import json
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage

# Try loading .env silently if python-dotenv is available
try:
    from dotenv import load_dotenv
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    load_dotenv(os.path.join(project_root, ".env"), override=False)
except Exception:
    pass

MAX_AI_URL = (os.getenv("MAX_AI_URL") or "").rstrip("/")
MAX_API_KEY = os.getenv("MAX_API_KEY") or ""
MAX_AI_MODEL = os.getenv("MAX_AI_MODEL", "GPT-4.1")
DO_CHAT_TEST = os.getenv("DO_CHAT_TEST", "0")  

def pretty(obj):
    return json.dumps(obj, ensure_ascii=False, indent=2)

def require_env():
    if not MAX_AI_URL:
        print("[ERROR] MAX_AI_URL is empty. Please set it in .env or environment.")
        sys.exit(2)
    if not MAX_API_KEY:
        print("[ERROR] MAX_API_KEY is empty. Please set it in .env or environment.")
        sys.exit(2)

def test_chat():
    # Build ChatOpenAI client same as backend usage
    headers = {
        "Authorization": f"Bearer {MAX_API_KEY}",
        "Content-Type": "application/json",
    }
    llm = ChatOpenAI(
        base_url=MAX_AI_URL,
        api_key=MAX_API_KEY,
        model=MAX_AI_MODEL,
        temperature=0,
        default_headers=headers,
        timeout=30,
        request_timeout=30,
    )

    prompt = (
        "Please list Mars company's five principles in English, in order, "
        "comma-separated, single line, no other text."
    )

    print(f"[INFO] Chat with model={MAX_AI_MODEL} at {MAX_AI_URL}")
    print(f"[INFO] Prompt: {prompt}")
    try:
        resp = llm.invoke([HumanMessage(content=prompt)])
    except Exception as e:
        print(f"[ERROR] Chat request failed: {e}")
        sys.exit(1)

    # AIMessage content
    content = getattr(resp, "content", "")
    if not content:
        content = json.dumps(getattr(resp, "__dict__", {}), ensure_ascii=False)[:200]
    print(f"[OK] Chat response: {content}")

def main():
    print(f"[INFO] MAX_AI_URL={MAX_AI_URL or '(empty)'}")
    print(f"[INFO] MAX_API_KEY={'(set)' if MAX_API_KEY else '(empty)'}")
    require_env()
    # Skip models test; only run chat connectivity with the specific prompt
    test_chat()
    print("[DONE] MAX AI connectivity test completed.")

if __name__ == "__main__":
    main()