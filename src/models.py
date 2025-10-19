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

from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class ExcelData(BaseModel):
    data: List[Dict[str, Any]]

class PDFUploadResponse(BaseModel):
    success: bool
    message: str
    answer: Optional[str] = None
    referenced_pages: Optional[List[Dict[str, Any]]] = None
    documents_processed: Optional[int] = None
    relevant_docs_found: Optional[int] = None
    error: Optional[str] = None

class QueryRequest(BaseModel):
    query: str
    hint: Optional[str] = None
    aet: Optional[str] = None

class QueryResponse(BaseModel):
    success: bool
    answer: Optional[str] = None
    referenced_pages: Optional[List[Dict[str, Any]]] = None
    relevant_docs_found: Optional[int] = None
    error: Optional[str] = None

class BatchQueryRequest(BaseModel):
    data: List[Dict[str, Any]]

class BatchQueryResponse(BaseModel):
    success: bool
    message: str
    data: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None

class RetryFailedRequest(BaseModel):
    data: List[Dict[str, Any]]  # Complete Excel Data Rows
    failed_indices: List[int]  # Row indices requiring reprocessing
    max_retry_rounds: Optional[int] = 5  # Maximum retry rounds
    auto_retry: Optional[bool] = True  # Whether to automatically retry until successful