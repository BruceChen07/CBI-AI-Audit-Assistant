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

import logging
from models import QueryRequest, QueryResponse, BatchQueryRequest, BatchQueryResponse
from rag_service import query_existing_knowledge_base
from fastapi import HTTPException

logger = logging.getLogger(__name__)

class QueryService:
    @staticmethod
    def single_query(request: QueryRequest) -> QueryResponse:
        """Single knowledge base query"""
        logger.info(f"Received knowledge base query request: {request.query[:100]}...")
        
        if not request.query.strip():
            logger.warning("Query content is empty")
            raise HTTPException(status_code=400, detail="Please provide query content")
        
        try:
            full_query = request.query
            
            # If a hint or AET is provided, add it to the query.
            context_parts = []
            if request.hint and request.hint.strip():
                context_parts.append(f"Hint information: {request.hint}")
            if request.aet and request.aet.strip():
                context_parts.append(f"AET information: {request.aet}")
            
            if context_parts:
                full_query = f"{request.query}\n\nbackground information:\n" + "\n".join(context_parts)
            
            logger.info(f"Start querying knowledge base: {full_query[:100]}...")
            result = query_existing_knowledge_base(full_query)
            
            if result["success"]:
                logger.info(f"Knowledge base query completed successfully")
                return QueryResponse(
                    success=True,
                    answer=result["answer"],
                    referenced_pages=result["referenced_pages"],
                    relevant_docs_found=result["relevant_docs_found"]
                )
            else:
                logger.error(f"Knowledge base query failed: {result['error']}")
                return QueryResponse(
                    success=False,
                    error=result["error"]
                )
        
        except Exception as e:
            logger.error(f"Knowledge base query error: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Knowledge base query error: {str(e)}")
    
    @staticmethod
    def batch_query(request: BatchQueryRequest) -> BatchQueryResponse:
        """Batch query knowledge base"""
        logger.info(f"Received batch query request, data rows: {len(request.data)}")
        
        try:
            results = []
            for i, row in enumerate(request.data):
                logger.info(f"Processing row {i+1}/{len(request.data)} data")
                
                # Copy original row data
                result_row = row.copy()
                
                # Query Hint data separately
                if "Hint" in row and row["Hint"] and str(row["Hint"]).strip() and str(row["Hint"]).strip().lower() != 'nan':
                    hint_query = f"Find relevant evidence based on the following hint information: {row['Hint']}"
                    hint_result = query_existing_knowledge_base(hint_query, query_type="hint")
                    if hint_result["success"]:
                        result_row["Evidence Collected by AI"] = hint_result["answer"]
                        
                        # Format reference information for Hint
                        if hint_result.get("referenced_pages"):
                            reference_info = []
                            for page in hint_result["referenced_pages"]:
                                reference_info.append(f"Page {page}")
                            result_row["Reference"] = "; ".join(reference_info)
                        else:
                            result_row["Reference"] = "No reference"
                        logger.info(f"Row {i+1} Hint query successful")
                    else:
                        result_row["Evidence Collected by AI"] = f"Query failed: {hint_result['error']}"
                        result_row["Reference"] = "Query failed"
                        logger.error(f"Row {i+1} Hint query failed: {hint_result['error']}")
                else:
                    result_row["Evidence Collected by AI"] = "No Hint information available"
                    result_row["Reference"] = "No Hint data"
                
                # Query AET data separately
                if "AET" in row and row["AET"] and str(row["AET"]).strip() and str(row["AET"]).strip().lower() != 'nan':
                    aet_query = f"Find evidence related to the following AET: {row['AET']}"
                    aet_result = query_existing_knowledge_base(aet_query, query_type="aet")
                    if aet_result["success"]:
                        result_row["AET Evidence Collected by AI"] = aet_result["answer"]
                        
                        # Format reference information for AET
                        if aet_result.get("referenced_pages"):
                            aet_reference_info = []
                            for page in aet_result["referenced_pages"]:
                                aet_reference_info.append(f"Page {page}")
                            result_row["AET Reference"] = "; ".join(aet_reference_info)
                        else:
                            result_row["AET Reference"] = "No reference"
                        logger.info(f"Row {i+1} AET query successful")
                    else:
                        result_row["AET Evidence Collected by AI"] = f"Query failed: {aet_result['error']}"
                        result_row["AET Reference"] = "Query failed"
                        logger.error(f"Row {i+1} AET query failed: {aet_result['error']}")
                else:
                    result_row["AET Evidence Collected by AI"] = "No AET information available"
                    result_row["AET Reference"] = "No AET data"
                
                results.append(result_row)
            
            logger.info(f"Batch query completed, processed {len(results)} rows of data")
            
            # Add column count statistics log
            if results:
                column_count = len(results[0].keys())
                logger.info(f"Batch query results completed, rows: {len(results)}, columns: {column_count}")
                logger.info(f"Final data columns: {list(results[0].keys())}")
            
            return BatchQueryResponse(success=True, message="Batch query completed", data=results)
            
        except Exception as e:
            logger.error(f"Batch query failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error during batch query: {str(e)}")