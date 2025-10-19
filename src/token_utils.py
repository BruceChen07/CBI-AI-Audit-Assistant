"""
Author: Bruce Chen <bruce.chen@effem.com>
Date: 2025-08-29

Copyright (c) 2025 Mars Corporation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"""

import os
import csv
import logging
from datetime import datetime
from typing import Dict, Tuple, Optional
import re
import math
from time import sleep

logger = logging.getLogger(__name__)

try:
    import tiktoken
except Exception as e:
    tiktoken = None
    logger.error(f"tiktoken import failed: {e}")

# Added: tokenizer cache and estimation
_ENCODER_CACHE: Dict[str, object] = {}

def _flatten_messages(messages) -> str:
    """Prefer extracting only message content to avoid noise from str(object)."""
    if messages is None:
        return ""
    parts = []
    for m in messages if isinstance(messages, (list, tuple)) else [messages]:
        if hasattr(m, "content"):
            parts.append(str(getattr(m, "content")))
        elif isinstance(m, dict) and "content" in m:
            parts.append(str(m.get("content")))
        else:
            parts.append(str(m))
    return "\n\n".join(parts)

def _rough_token_estimate(text: str) -> int:
    """Fallback estimate when network/cache issues occur. Approximate: CJK ~ 1 char ≈ 1 token; others ~ 4 chars ≈ 1 token."""
    if not text:
        return 0
    cjk = sum(1 for ch in text if "\u4e00" <= ch <= "\u9fff")
    others = len(text) - cjk
    return cjk + math.ceil(others / 4)

def _get_encoder_safe(encoder_name: str, retries: int = 2, backoff: float = 0.3):
    """Loader with retries and local cache to avoid transient IncompleteRead causing token counting failures."""
    if tiktoken is None:
        return None
    if encoder_name in _ENCODER_CACHE:
        return _ENCODER_CACHE[encoder_name]

    last_err: Optional[Exception] = None
    for i in range(retries + 1):
        try:
            enc = tiktoken.get_encoding(encoder_name)
            _ENCODER_CACHE[encoder_name] = enc
            return enc
        except Exception as e:
            last_err = e
            # Exponential backoff, wait then retry
            sleep(backoff * (2 ** i))
    logger.warning(f"Failed to load tiktoken encoder={encoder_name}, error={last_err}")
    return None

def num_tokens_from_messages(messages, encoder_name: str = "cl100k_base") -> int:
    """
    Compute the token count for a set of messages. If tokenizer loading/encoding fails,
    fall back to a heuristic estimate to avoid returning 0.
    """
    if tiktoken is None:
        logger.warning("tiktoken not available, returning 0 for token count.")
        return 0

    text = _flatten_messages(messages)
    if not text:
        return 0

    encoder = _get_encoder_safe(encoder_name)
    if encoder is not None:
        try:
            return len(encoder.encode(text))
        except Exception as e:
            logger.warning(f"Failed to compute tokens, encoder={encoder_name}, error={e}. Falling back to heuristic estimation.")

    # Fallback: heuristic estimate (non-blocking)
    est_tokens = _rough_token_estimate(text)
    logger.info(f"Using heuristic token estimate={est_tokens} due to tokenizer error, encoder={encoder_name}")
    return est_tokens

def _parse_price(val) -> float:
    """
    Parse a price field into float:
    - Remove non-numeric characters such as $, commas, spaces, line breaks
    - Ignore values like None/N/A
    - Return 0.0 if parsing fails
    """
    if val is None:
        return 0.0
    s = str(val).strip()
    if not s:
        return 0.0
    if s.upper() in {"NONE", "N/A"}:
        return 0.0
    # Keep digits, dot and minus; strip others (e.g., $, commas, whitespace)
    s = re.sub(r"[^0-9.\-]", "", s)
    if not s:
        return 0.0
    try:
        return float(s)
    except Exception:
        return 0.0

"""
Cache and normalize model names for pricing table lookups.
"""
_PRICING_TABLE_CACHE: Tuple[str, Dict[str, Tuple[float, float]]] = ("", {})

def _get_default_pricing_path() -> str:
    if "PRICING_FILE" in os.environ:
        return os.environ["PRICING_FILE"]
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    return os.path.join(project_root, "mapping", "pricing_model.csv")

def _get_pricing_table() -> Tuple[str, Dict[str, Tuple[float, float]]]:
    global _PRICING_TABLE_CACHE
    path = _get_default_pricing_path()
    cached_path, cached_table = _PRICING_TABLE_CACHE
    if cached_table and cached_path == path:
        return cached_path, cached_table
    table = _load_pricing_table(path)
    _PRICING_TABLE_CACHE = (path, table)
    return path, table

def _canon(s: str) -> str:
    """Case-insensitive, with non-alphanumeric characters removed, used to match different writings (such as differences in case, hyphens, spaces, and periods)."""
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())

def normalize_model_name(model_name: str, pricing_table: Optional[Dict[str, Tuple[float, float]]] = None) -> str:
    """
    Normalize the incoming model name to the standard name in the pricing table:  
    • Case-insensitive, ignoring differences such as hyphens, spaces, and periods  

    • If a standard key can be found in the pricing table, return that standard key; otherwise, return the original string with leading and trailing spaces removed
    """
    if not model_name:
        return model_name
    if pricing_table:
        idx: Dict[str, str] = {_canon(k): k for k in pricing_table.keys()}
        key = _canon(model_name)
        if key in idx:
            return idx[key]
    return str(model_name).strip()

def _load_pricing_table(csv_path: str) -> Dict[str, Tuple[float, float]]:
    """
    Load model pricing from CSV. Expected column names:
      - Model Name
      - Input Cost(1M Tokens)
      - Output Cost(1M Tokens)
    Returns dict: { model_name: (input_cost_per_million, output_cost_per_million) }
    """
    table: Dict[str, Tuple[float, float]] = {}
    if not os.path.exists(csv_path):
        logger.info(f"Pricing file not found at {csv_path}. Token costs will be 0 by default.")
        return table

    try:
        with open(csv_path, "r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = (row.get("Model Name") or "").strip()
                if not name:
                    continue
                in_cost = _parse_price(row.get("Input Cost(1M Tokens)"))
                out_cost = _parse_price(row.get("Output Cost(1M Tokens)"))
                table[name] = (in_cost, out_cost)
    except Exception as e:
        logger.error(f"Failed to read pricing CSV at {csv_path}: {e}")
    return table

def calculate_token_cost(model_name: str, input_tokens: int, output_tokens: int) -> Tuple[float, float]:
    """
    Calculate input/output costs based on per-million-token price. Price source priority:
      1) Environment variable PRICING_FILE specifies the CSV
      2) Default ./mapping/pricing_model.csv
    If the model or file is not found, returns zero cost and logs a warning.
    """
    if "PRICING_FILE" in os.environ:
        pricing_path = os.environ["PRICING_FILE"]
    else:
        # Based on this script's directory, go to the project root and locate mapping/pricing_model.csv
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        pricing_path = os.path.join(project_root, "mapping", "pricing_model.csv")

    pricing_table = _load_pricing_table(pricing_path)
    if not pricing_table:
        return 0.0, 0.0

    canon = normalize_model_name(model_name, pricing_table)
    if canon not in pricing_table:
        logger.warning(
            f"No pricing information found for model '{model_name}' (normalized='{canon}'). "
            f"CSV: {pricing_path}. Available models (sample): {list(pricing_table.keys())[:10]}"
        )
        return 0.0, 0.0

    in_per_million, out_per_million = pricing_table[canon]
    in_cost = (input_tokens / 1_000_000.0) * in_per_million
    out_cost = (output_tokens / 1_000_000.0) * out_per_million
    return in_cost, out_cost

def log_token_usage(model_name: str,
                    input_tokens: int,
                    output_tokens: int,
                    caller_method: str,
                    session_id: Optional[str] = None) -> None:
    """
    Write token usage into a daily log file (./token/YYYY-MM-DD_token_usage.txt).
    Also compute input/output costs and the subtotal.
    """
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    token_folder = "token"
    if not os.path.exists(token_folder):
        try:
            os.makedirs(token_folder)
            logger.info(f"Successfully created token folder at {token_folder}")
        except Exception as e:
            logger.error(f"Failed to create token folder at {token_folder}, error: {str(e)}")
    log_file = os.path.join(token_folder, f"{date_str}_token_usage.txt")

    in_cost, out_cost = calculate_token_cost(model_name, input_tokens, output_tokens)
    total_cost = in_cost + out_cost
    timestamp = now.strftime("%Y-%m-%d %H:%M:%S")
    sid = f", Session: {session_id}" if session_id else ""

    line = (
        f"Timestamp: {timestamp}, Model: {model_name}, "
        f"Input Tokens: {input_tokens}, Output Tokens: {output_tokens}, "
        f"Caller Method: {caller_method}{sid}, "
        f"Input Cost: ${in_cost:.6f}, Output Cost: ${out_cost:.6f}, Total Cost: ${total_cost:.6f}\n"
    )

    try:
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(line)
    except Exception as e:
        logger.error(f"Failed to write token usage log: {e}")