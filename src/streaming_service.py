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

import json
import logging
import asyncio
import uuid
from datetime import datetime, timedelta
from fastapi.responses import StreamingResponse
from models import BatchQueryRequest, RetryFailedRequest
from rag_service import query_existing_knowledge_base

logger = logging.getLogger(__name__)

# Global retry control
retry_control = {
    "should_stop": False,
    "current_session_id": None
}

# Data cache - store processed data
data_cache = {}

class StreamingService:
    @staticmethod
    def _store_processed_data(session_id: str, data: list, statistics: dict):
        """Store processed data in the cache"""
        data_cache[session_id] = {
            "data": data,
            "statistics": statistics,
            "timestamp": datetime.now(),
            "expires_at": datetime.now() + timedelta(hours=2)  # expires after 2 hours
        }
        logger.info(f"Stored processed data for session {session_id}, {len(data)} records")
    
    @staticmethod
    def get_cached_data(session_id: str):
        """Get processed data from the cache"""
        if session_id not in data_cache:
            return None
        
        cached_item = data_cache[session_id]
        
        # Check whether it is expired
        if datetime.now() > cached_item["expires_at"]:
            del data_cache[session_id]
            logger.info(f"Cached data for session {session_id} has expired and been removed")
            return None
        
        return cached_item
    
    @staticmethod
    def cleanup_expired_cache():
        """Clean up expired cached data"""
        current_time = datetime.now()
        expired_sessions = []
        
        for session_id, cached_item in data_cache.items():
            if current_time > cached_item["expires_at"]:
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            del data_cache[session_id]
            logger.info(f"Removed expired cached data for session {session_id}")
        
        return len(expired_sessions)

    @staticmethod
    async def batch_query_stream(request: BatchQueryRequest) -> StreamingResponse:
        """Stream batch query the knowledge base"""
        # Generate session ID
        session_id = str(uuid.uuid4())
        logger.info(f"Starting batch query session {session_id}, data rows: {len(request.data)}")
        
        async def generate_progress():
            try:
                results = []
                total_count = len(request.data)

                # Added: accumulate total token usage for this batch
                total_input_tokens = 0
                total_output_tokens = 0
                # End
                
                for i, row in enumerate(request.data):
                    logger.info(f"Start processing row {i+1}/{total_count}")
                    
                    # Send progress update
                    progress_data = {
                        "type": "progress",
                        "completed": i,
                        "total": total_count,
                        "percentage": (i / total_count) * 100,
                        "message": f"Start processing row {i+1}/{total_count}"
                    }
                    yield f"data: {json.dumps(progress_data, ensure_ascii=False)}\n\n"
                    
                    # Copy original row data
                    result_row = row.copy()
                    
                    # Query Hint data separately
                    hint_success = False
                    if "Hint" in row and row["Hint"] and str(row["Hint"]).strip() and str(row["Hint"]).strip().lower() != 'nan':
                        hint_query = f"Find relevant evidence based on the following hint information: {row['Hint']}"
                        hint_result = query_existing_knowledge_base(hint_query, query_type="hint")
                        if hint_result["success"]:
                            result_row["Evidence Collected by AI"] = hint_result["answer"]
                            # Added: accumulate Hint tokens
                            try:
                                t = hint_result.get("tokens") or {}
                                total_input_tokens += int(t.get("input", 0))
                                total_output_tokens += int(t.get("output", 0))
                            except Exception:
                                pass
                            # End
                            
                            # Format reference information for Hint
                            if hint_result.get("referenced_pages"):
                                reference_info = []
                                for page in hint_result["referenced_pages"]:
                                    reference_info.append(f"Page {page}")
                                result_row["Reference"] = "; ".join(reference_info)
                            else:
                                result_row["Reference"] = "No reference"
                            hint_success = True
                            logger.info(f"Row {i+1} Hint query successful")
                        else:
                            result_row["Evidence Collected by AI"] = f"Query failed: {hint_result['error']}"
                            result_row["Reference"] = "Query failed"
                            logger.warning(f"Row {i+1} Hint query failed: {hint_result['error']}")
                    else:
                        result_row["Evidence Collected by AI"] = "No Hint information available"
                        result_row["Reference"] = "No Hint data"
                    
                    # Query AET data separately
                    aet_success = False
                    if "AET" in row and row["AET"] and str(row["AET"]).strip() and str(row["AET"]).strip().lower() != 'nan':
                        aet_query = f"Find evidence related to the following AET: {row['AET']}"
                        aet_result = query_existing_knowledge_base(aet_query, query_type="aet")
                        if aet_result["success"]:
                            result_row["AET Evidence Collected by AI"] = aet_result["answer"]
                            # Added: accumulate AET tokens
                            try:
                                t = aet_result.get("tokens") or {}
                                total_input_tokens += int(t.get("input", 0))
                                total_output_tokens += int(t.get("output", 0))
                            except Exception:
                                pass
                            # End
                            
                            # Format reference information for AET
                            if aet_result.get("referenced_pages"):
                                aet_reference_info = []
                                for page in aet_result["referenced_pages"]:
                                    aet_reference_info.append(f"Page {page}")
                                result_row["AET Reference"] = "; ".join(aet_reference_info)
                            else:
                                result_row["AET Reference"] = "No reference"
                            aet_success = True
                            logger.info(f"Row {i+1} AET query successful")
                        else:
                            result_row["AET Evidence Collected by AI"] = f"Query failed: {aet_result['error']}"
                            result_row["AET Reference"] = "Query failed"
                            logger.warning(f"Row {i+1} AET query failed: {aet_result['error']}")
                    else:
                        result_row["AET Evidence Collected by AI"] = "No AET information available"
                        result_row["AET Reference"] = "No AET data"
                    
                    results.append(result_row)
                    
                    logger.info(f"Row {i+1} field values:")
                    logger.info(f"  Evidence Collected by AI: {result_row.get('Evidence Collected by AI', 'N/A')[:100]}...")
                    logger.info(f"  Reference: {result_row.get('Reference', 'N/A')}")
                    logger.info(f"  AET Evidence Collected by AI: {result_row.get('AET Evidence Collected by AI', 'N/A')[:100]}...")
                    logger.info(f"  AET Reference: {result_row.get('AET Reference', 'N/A')}")
                    
                    # Send completion progress
                    completed_progress = {
                        "type": "progress",
                        "completed": i + 1,
                        "total": total_count,
                        "percentage": ((i + 1) / total_count) * 100,
                        "message": f"Completed question {i+1}/{total_count}"
                    }
                    yield f"data: {json.dumps(completed_progress, ensure_ascii=False)}\n\n"
                
                # Calculate processing results
                success_count = 0
                failed_indices = []
                
                for idx, result in enumerate(results):
                    hint_evidence = result.get("Evidence Collected by AI", "")
                    aet_evidence = result.get("AET Evidence Collected by AI", "")
                    
                    # Consider successful if either Hint or AET query succeeded
                    hint_success = hint_evidence and not hint_evidence.startswith(("Query failed", "No Hint information", "Sorry, AI service is temporarily unavailable"))
                    aet_success = aet_evidence and not aet_evidence.startswith(("Query failed", "No AET information", "Sorry, AI service is temporarily unavailable"))
                    
                    if hint_success or aet_success:
                        success_count += 1
                    else:
                        failed_indices.append(idx)
                
                failed_count = len(failed_indices)

                # Added: generate batch summary (invoke LLM again and record/accumulate tokens)
                try:
                    from rag_service import generate_ai_response, MAX_AI_MODEL
                    # Summary prompt: only use statistics to avoid extra context overhead
                    summary_query = (
                        "Provide an executive batch summary for the audit AI run. "
                        f"Total rows: {len(results)}; Success: {success_count}; Failed: {failed_count}. "
                        "State the overall status, highlight common patterns and risks, "
                        "and propose next steps in a concise, formal audit style."
                    )
                    summary_resp = generate_ai_response(summary_query, "summary", [])
                    # Accumulate summary tokens
                    try:
                        st = summary_resp.get("tokens") or {}
                        total_input_tokens += int(st.get("input", 0))
                        total_output_tokens += int(st.get("output", 0))
                    except Exception:
                        pass
                    batch_summary = summary_resp.get("answer", "")
                except Exception as e:
                    logger.error(f"Batch summary generation failed: {e}")
                    batch_summary = "Batch summary generation failed."
                    # If it fails, do not accumulate tokens
                # End
                
                # Send final result
                final_result = {
                    "type": "complete",
                    "success": True,
                    "session_id": session_id,  # Add session ID
                    "message": f"Batch query completed, processed {len(results)} rows of data, successful {success_count} records, failed {failed_count} records",
                    "data": results,
                    "statistics": {
                        "total": len(results),
                        "success": success_count,
                        "failed": failed_count,
                        "failed_indices": failed_indices
                    },
                    # Added: include token usage stats and summary text
                    "token_usage": {
                        "total_input_tokens": total_input_tokens,
                        "total_output_tokens": total_output_tokens
                    },
                    "summary": batch_summary
                    # End
                }
                
                # Store processed data into cache
                StreamingService._store_processed_data(
                    session_id, 
                    results, 
                    final_result["statistics"]
                )

                # Added: write the Total summary log for this batch
                try:
                    # Local import to avoid changing top-level imports
                    from token_utils import log_token_usage
                    from rag_service import generate_ai_response, get_current_model
                    total_model = get_current_model()
                    log_token_usage(total_model, total_input_tokens, total_output_tokens, "batch_query_stream TOTAL", session_id=session_id)
                except Exception as _:
                    pass
                # End
                
                yield f"data: {json.dumps(final_result, ensure_ascii=False)}\n\n"
                logger.info(f"Streaming batch query completed for session {session_id}, processed {len(results)} rows of data, successful {success_count} records, failed {failed_count} records")
                
            except Exception as e:
                logger.error(f"Streaming batch query error: {str(e)}", exc_info=True)
                error_result = {
                    "type": "error",
                    "success": False,
                    "message": "Batch query failed",
                    "error": f"Batch query error: {str(e)}"
                }
                yield f"data: {json.dumps(error_result, ensure_ascii=False)}\n\n"
        
        return StreamingResponse(
            generate_progress(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream"
            }
        )
    
    @staticmethod
    def stop_retry():
        """Stop current retry operation"""
        retry_control["should_stop"] = True
        logger.info("User requested to stop retry operation")
        return {"success": True, "message": "Retry operation stopped"}
    
    @staticmethod
    async def retry_failed_stream(request: RetryFailedRequest) -> StreamingResponse:
        """Smart streaming retry for failed records"""
        session_id = str(uuid.uuid4())
        retry_control["current_session_id"] = session_id
        retry_control["should_stop"] = False
        
        logger.info(f"Starting smart retry session {session_id}, need to reprocess {len(request.failed_indices)} failed records")
        
        async def generate_retry_progress():
            try:
                results = request.data.copy()  # Copy complete data
                current_failed_indices = request.failed_indices.copy()
                retry_round = 0
                max_rounds = request.max_retry_rounds or 5
                auto_retry = request.auto_retry if request.auto_retry is not None else True
                
                while current_failed_indices and retry_round < max_rounds:
                    # Check if stopped by user
                    if retry_control["should_stop"] or retry_control["current_session_id"] != session_id:
                        yield f"data: {json.dumps({'type': 'stopped', 'message': 'Retry stopped by user'}, ensure_ascii=False)}\n\n"
                        return
                    
                    retry_round += 1
                    logger.info(f"Starting round {retry_round}/{max_rounds} retry, processing {len(current_failed_indices)} records")
                    
                    # Send round start info
                    round_start_data = {
                        "type": "round_start",
                        "round": retry_round,
                        "max_rounds": max_rounds,
                        "failed_count": len(current_failed_indices),
                        "message": f"Starting round {retry_round}/{max_rounds} retry"
                    }
                    yield f"data: {json.dumps(round_start_data, ensure_ascii=False)}\n\n"
                    
                    round_success_indices = []
                    round_failed_indices = []
                    
                    for idx, original_idx in enumerate(current_failed_indices):
                        # Check stop status again
                        if retry_control["should_stop"] or retry_control["current_session_id"] != session_id:
                            yield f"data: {json.dumps({'type': 'stopped', 'message': 'Retry stopped by user'}, ensure_ascii=False)}\n\n"
                            return
                        
                        logger.info(f"Round {retry_round}: processing record {idx+1}/{len(current_failed_indices)} (original index: {original_idx})")
                        
                        # Send progress update
                        progress_data = {
                            "type": "progress",
                            "round": retry_round,
                            "completed": idx,
                            "total": len(current_failed_indices),
                            "percentage": (idx / len(current_failed_indices)) * 100,
                            "message": f"Round {retry_round}: processing record {idx+1}/{len(current_failed_indices)}",
                            "current_index": original_idx
                        }
                        yield f"data: {json.dumps(progress_data, ensure_ascii=False)}\n\n"
                    
                        # Get row data that needs reprocessing
                        if original_idx < len(results):
                            row = results[original_idx]
                            
                            # Build query text, prioritize Hint, then AET
                            query_text = ""
                            query_type = "general"
                            if "Hint" in row and row["Hint"] and str(row["Hint"]).strip():
                                query_text = f"Find relevant evidence based on the following hint information: {row['Hint']}"
                                query_type = "hint"
                            elif "AET" in row and row["AET"] and str(row["AET"]).strip():
                                query_text = f"Find evidence related to the following AET: {row['AET']}"
                                query_type = "aet"
                            
                            if query_text:
                                # Add exponential backoff delay (no delay for first round)
                                if retry_round > 1:
                                    delay = min(2 ** (retry_round - 2), 10)  # Max delay 10 seconds
                                    logger.info(f"Round {retry_round} retry, waiting {delay} seconds before processing index {original_idx}")
                                    await asyncio.sleep(delay)
                                
                                # Query knowledge base
                                query_result = query_existing_knowledge_base(query_text, query_type=query_type)
                                if query_result["success"]:
                                    results[original_idx]["Evidence Collected by AI"] = query_result["answer"]
                                    
                                    # Reference column - format reference page info
                                    if query_result.get("referenced_pages"):
                                        reference_info = []
                                        for ref in query_result["referenced_pages"]:
                                            if isinstance(ref, dict):
                                                ref_text = f"{ref.get('source', 'Unknown')} Page {ref.get('page', 'Unknown')}"
                                                if ref.get('similarity_score'):
                                                    ref_text += f" (Similarity: {(ref['similarity_score'] * 100):.1f}%)"
                                            else:
                                                ref_text = f"Page {ref}"
                                            reference_info.append(ref_text)
                                        results[original_idx]["Reference"] = "; ".join(reference_info)
                                    else:
                                        results[original_idx]["Reference"] = "No reference"
                                    
                                    round_success_indices.append(original_idx)
                                    logger.info(f"Round {retry_round}: index {original_idx} processed successfully")
                                else:
                                    round_failed_indices.append(original_idx)
                                    logger.warning(f"Round {retry_round}: index {original_idx} processing failed: {query_result['error']}")
                            else:
                                # Records without query info are marked as skipped, no more retries
                                results[original_idx]["Evidence Collected by AI"] = "No available query information (both Hint and AET are empty)"
                                results[original_idx]["Reference"] = "No query information"
                                logger.warning(f"Round {retry_round}: index {original_idx} has no available query information, skipping")
                        else:
                            # Index out of range, skip processing
                            logger.warning(f"Round {retry_round}: skipping index {original_idx}, out of data range (total length: {len(results)})")
                        
                        # Send single record completion progress update
                        completed_progress = {
                            "type": "progress",
                            "round": retry_round,
                            "completed": idx + 1,
                            "total": len(current_failed_indices),
                            "percentage": ((idx + 1) / len(current_failed_indices)) * 100,
                            "message": f"Round {retry_round}: processed record {idx+1}/{len(current_failed_indices)}",
                            "current_index": original_idx
                        }
                        yield f"data: {json.dumps(completed_progress, ensure_ascii=False)}\n\n"
                
                    # Round end statistics
                    round_end_data = {
                        "type": "round_completed",
                        "round": retry_round,
                        "success_count": len(round_success_indices),
                        "failed_count": len(round_failed_indices),
                        "success_indices": round_success_indices,
                        "failed_indices": round_failed_indices,
                        "message": f"Round {retry_round} retry completed: successful {len(round_success_indices)} records, failed {len(round_failed_indices)} records"
                    }
                    yield f"data: {json.dumps(round_end_data, ensure_ascii=False)}\n\n"
                    
                    # Update indices for next round retry
                    current_failed_indices = round_failed_indices
                    
                    # Check if need to continue retry
                    if not current_failed_indices:
                        # All records succeeded
                        logger.info(f"All failed records have been successfully fixed in round {retry_round} retry")
                        break
                    elif retry_round >= max_rounds:
                        # Reached max retry rounds
                        logger.info(f"Reached maximum retry rounds {max_rounds}, stopping retry")
                        break
                    elif not auto_retry:
                        # Non-auto retry mode, only execute one round
                        logger.info("Non-auto retry mode, retry completed")
                        break
                    
                    # Check if user requested stop
                    if retry_control["should_stop"]:
                        logger.info(f"User requested stop retry, terminating after round {retry_round}")
                        break
                
                # Final statistics
                final_success_count = 0
                final_failed_count = 0
                final_failed_indices = []
                skipped_count = 0
                skipped_indices = []
                
                for original_idx in request.failed_indices:
                    if original_idx < len(results):
                        row = results[original_idx]
                        # Check if has valid Evidence
                        if ("Evidence Collected by AI" in row and 
                            row["Evidence Collected by AI"] and 
                            str(row["Evidence Collected by AI"]).strip() and
                            not str(row["Evidence Collected by AI"]).startswith("Still failed after retry") and
                            not str(row["Evidence Collected by AI"]).startswith("No available query information")):
                            final_success_count += 1
                        else:
                            final_failed_count += 1
                            final_failed_indices.append(original_idx)
                    else:
                        skipped_count += 1
                        skipped_indices.append(original_idx)
                
                # Record final statistics
                stop_reason = "User stopped" if retry_control["should_stop"] else ("All successful" if not final_failed_indices else f"Reached max retry rounds ({max_rounds})")
                logger.info(f"Retry processing completed - Reason: {stop_reason}, Total rounds: {retry_round}, Final success: {final_success_count}, Still failed: {final_failed_count}, Skipped: {skipped_count}")
                
                # Send final completion message
                final_result = {
                    "type": "complete",
                    "success": True,
                    "message": f"Retry processing completed - {stop_reason}",
                    "total_rounds": retry_round,
                    "stop_reason": stop_reason,
                    "data": results,
                    "retry_statistics": {
                        "total_retried": len(request.failed_indices),
                        "retry_success": final_success_count,
                        "still_failed": final_failed_count,
                        "still_failed_indices": final_failed_indices,
                        "skipped": skipped_count,
                        "skipped_indices": skipped_indices
                    }
                }
                yield f"data: {json.dumps(final_result, ensure_ascii=False)}\n\n"
                
            except Exception as e:
                logger.error(f"Error reprocessing failed records: {str(e)}", exc_info=True)
                error_result = {
                    "type": "error",
                    "success": False,
                    "message": "Reprocessing failed",
                    "error": f"Error during reprocessing: {str(e)}"
                }
                yield f"data: {json.dumps(error_result, ensure_ascii=False)}\n\n"
        
        return StreamingResponse(
            generate_retry_progress(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream"
            }
        )