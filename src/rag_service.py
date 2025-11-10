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
import logging
import pymupdf as fitz
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document
import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from chromadb.api.models.Collection import Collection
from langchain_openai import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Any
import re

# Disable telemetry
os.environ['DISABLE_TELEMETRY'] = 'true'
os.environ["CHROMA_TELEMETRY_DISABLED"] = "true"

# load config from .env
try:
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    load_dotenv(os.path.join(project_root, ".env"), override=False)
except Exception:
    pass
logger = logging.getLogger(__name__)

# Define the embedding models (provider + fallback to local)
EMBEDDING_PROVIDER = os.environ.get("EMBEDDING_PROVIDER", "local").lower()
EMBEDDING_HF_ID = os.environ.get("EMBEDDING_HF_ID", "BAAI/bge-small-en-v1.5")
EMBEDDING_MS_ID = os.environ.get("EMBEDDING_MS_ID", "AI-ModelScope/bge-small-en-v1.5")

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EMBEDDING_LOCAL_DIR = os.environ.get(
    "EMBEDDING_LOCAL_DIR",
    os.path.join(project_root, "models", "AI-ModelScope", "bge-small-en-v1___5"),
)

def resolve_embedding_model() -> str:
    try:
        if EMBEDDING_PROVIDER == "local":
            if os.path.isdir(EMBEDDING_LOCAL_DIR):
                logger.info(f"Using local embedding model: {EMBEDDING_LOCAL_DIR}")
                return EMBEDDING_LOCAL_DIR
            raise FileNotFoundError(f"Local embedding dir not found: {EMBEDDING_LOCAL_DIR}")

        if EMBEDDING_PROVIDER == "modelscope":
            try:
                from modelscope.hub.snapshot_download import snapshot_download
            except Exception as e:
                logger.warning(f"ModelScope not available: {e}. Falling back to local/HF.")
            else:
                cache_dir = os.path.join(project_root, "models")
                os.makedirs(cache_dir, exist_ok=True)
                model_dir = snapshot_download(EMBEDDING_MS_ID, cache_dir=cache_dir)
                logger.info(f"ModelScope model ready at: {model_dir}")
                return model_dir

        logger.info(f"Using HF embedding model id: {EMBEDDING_HF_ID}")
        return EMBEDDING_HF_ID
    except Exception as e:
        logger.error(f"Resolve embedding model failed: {e}", exc_info=True)
        if os.path.isdir(EMBEDDING_LOCAL_DIR):
            logger.info(f"Falling back to local embedding at {EMBEDDING_LOCAL_DIR}")
            return EMBEDDING_LOCAL_DIR
        return EMBEDDING_HF_ID

EMBEDDING_MODEL = resolve_embedding_model()
BATCH_SIZE = 100  # Batch insert size for improved write performance

# LLM configuration
MAX_AI_URL = os.environ.get("MAX_AI_URL", "")
MAX_API_KEY = os.environ.get("MAX_API_KEY", "")
MAX_AI_MODEL = os.environ.get("MAX_AI_MODEL", "GPT-4.1")
TEMPERATURE = float(os.environ.get("AI_TEMPERATURE", "0.2") or 0.2)

# print environment variables
logger.info(f"[env] MAX_AI_URL = {MAX_AI_URL or '(empty)'}")
logger.info(f"[env] MAX_API_KEY = {'(set)' if MAX_API_KEY else '(empty)'}")

if not MAX_AI_URL or not MAX_API_KEY:
    logger.warning("MAX_AI_URL/MAX_API_KEY not set; please configure environment variables in .env")

# MAX_AI headers
MAX_AI_HEADERS = {
    "Authorization": f"Bearer {MAX_API_KEY}" if MAX_API_KEY else "",
    "Content-Type": "application/json"
}

llm_client = ChatOpenAI(
    base_url=MAX_AI_URL or None,
    api_key=MAX_API_KEY or None,
    model=MAX_AI_MODEL,
    temperature=TEMPERATURE,
    default_headers=MAX_AI_HEADERS if MAX_API_KEY else None,
    timeout=90
)

logger.info(f"LLM client initialized - Model: {MAX_AI_MODEL}, Temperature: {TEMPERATURE}")

def _load_admin_config_safely():
    """
    Lazy import to avoid potential circular dependencies. Returns None on failure.
    """
    try:
        import auth  # lazy import
        # Use the actual function defined in auth.py to fetch current config
        return auth.get_config()
    except Exception:
        return None

def get_current_model() -> str:
    """
    Returns the model from Admin configuration; falls back to MAX_AI_MODEL if unavailable.
    """
    cfg = _load_admin_config_safely()
    model = (cfg or {}).get("model")
    return model.strip() if isinstance(model, str) and model.strip() else MAX_AI_MODEL

def get_current_temperature() -> float:
    """
    Returns the temperature from Admin configuration; falls back to TEMPERATURE if unavailable.
    """
    cfg = _load_admin_config_safely()
    try:
        val = float((cfg or {}).get("temperature", TEMPERATURE))
        return max(0.0, min(2.0, val))
    except Exception:
        return TEMPERATURE
# MAX_AI headers
MAX_AI_HEADERS = {
    "Authorization": f"Bearer {MAX_API_KEY}",
    "Content-Type": "application/json"
}

# Initialize LLM client with timeout settings
llm_client = ChatOpenAI(
    base_url=MAX_AI_URL,
    api_key=MAX_API_KEY,
    model=MAX_AI_MODEL,
    temperature=TEMPERATURE,
    default_headers=MAX_AI_HEADERS,
    timeout=90,  # 90 seconds timeout
    request_timeout=90  # Request timeout
)

# Log LLM initialization configuration
logger.info(f"LLM client initialized - Model: {MAX_AI_MODEL}, Temperature: {TEMPERATURE}")

def get_llm_client() -> ChatOpenAI:
    """
    Create a ChatOpenAI client using the latest Admin configuration (model/temperature).
    Falls back to the static llm_client if dynamic initialization fails.
    """
    model = get_current_model()
    temperature = get_current_temperature()
    try:
        return ChatOpenAI(
            base_url=MAX_AI_URL,
            api_key=MAX_API_KEY,
            model=model,
            temperature=temperature,
            default_headers=MAX_AI_HEADERS,
            timeout=90,
            request_timeout=90,
        )
    except Exception as e:
        logger.warning(f"Dynamic LLM client initialization failed, falling back to static client: {e}")
        return llm_client

# Initialize ChromaDB (in-memory, non-persistent)
chroma_client = chromadb.Client()
embedding_function = SentenceTransformerEmbeddingFunction(model_name=EMBEDDING_MODEL)

def collection_exists(client, collection_name):
    """Check if a collection exists in ChromaDB"""
    collections = client.list_collections()
    return any(col.name == collection_name for col in collections)

def get_existing_files(collection: Collection) -> set:
    """Get all existing filenames from a collection"""
    try:
        # Query all documents to get existing filenames
        results = collection.query(
            query_texts=[""],  # Empty query to get all documents
            n_results=1000,  # Adjust based on expected number of documents
            include=["metadatas"]
        )
        
        existing_files = set()
        for metadata in results["metadatas"][0]:
            if "source" in metadata:
                existing_files.add(metadata["source"])
        
        return existing_files
    except Exception as e:
        logger.error(f"Failed to get existing files: {str(e)}")
        return set()

def load_pdf_from_bytes(pdf_bytes: bytes, filename: str) -> List[Document]:
    """Load PDF from bytes and extract text with page information"""
    all_docs = []
    
    try:
        with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
            # Extract text per page to preserve page information
            pages_text = []
            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text("text", flags=fitz.TEXT_PRESERVE_LIGATURES)
                if text.strip():  # Skip empty pages
                    pages_text.append({
                        "page_num": page_num + 1,
                        "text": text
                    })
            
            if not pages_text:
                logger.warning(f"No text content found in PDF: {filename}")
                return all_docs
            
            # Split text into chunks
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                length_function=len,
                separators=["\n\n", "\n", " ", ""]
            )
            
            for page_info in pages_text:
                page_num = page_info["page_num"]
                text = page_info["text"]
                
                # Split page text into chunks
                chunks = text_splitter.split_text(text)
                
                for i, chunk in enumerate(chunks):
                    if chunk.strip():
                        doc = Document(
                            page_content=chunk,
                            metadata={
                                "source": filename,
                                "page": page_num,
                                "chunk_id": f"{filename}_page_{page_num}_chunk_{i}",
                            }
                        )
                        all_docs.append(doc)
        
        logger.info(f"PDF processed successfully: {filename} ({len(all_docs)} chunks extracted)")
        return all_docs
        
    except Exception as e:
        logger.error(f"Error processing PDF {filename}: {str(e)}")
        return []

def store_documents_in_chromadb(documents: List[Document], collection_name: str = "pdf_knowledge_base"):
    """Store documents in ChromaDB (temporary, in-memory)"""
    try:
        # Delete existing collection if it exists (as per user requirement)
        if collection_exists(chroma_client, collection_name):
            logger.debug(f"Recreating collection '{collection_name}'")
            chroma_client.delete_collection(collection_name)
        
        # Create a new collection (will be deleted after use)
        collection = chroma_client.create_collection(
            name=collection_name,
            embedding_function=embedding_function
        )
        
        # Prepare data for batch insertion
        texts = [doc.page_content for doc in documents]
        metadatas = [doc.metadata for doc in documents]
        ids = [doc.metadata["chunk_id"] for doc in documents]
        
        # Batch insert documents
        for i in range(0, len(documents), BATCH_SIZE):
            batch_texts = texts[i:i + BATCH_SIZE]
            batch_metadatas = metadatas[i:i + BATCH_SIZE]
            batch_ids = ids[i:i + BATCH_SIZE]
            
            collection.add(
                documents=batch_texts,
                metadatas=batch_metadatas,
                ids=batch_ids
            )
        
        logger.info(f"Documents stored in collection '{collection_name}': {len(documents)} chunks")
        return collection
        
    except Exception as e:
        logger.error(f"Error storing documents in ChromaDB: {str(e)}")
        return None

def search_knowledge_base(query: str, collection, top_k: int = 5) -> List[Dict[str, Any]]:
    """Search the knowledge base for relevant documents"""
    try:
        if not collection:
            logger.warning("No collection provided for search")
            return []
        
        # Search for relevant documents
        results = collection.query(
            query_texts=[query],
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )
        
        # Format results
        search_results = []
        for i, (doc, metadata, distance) in enumerate(zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0]
        )):
            search_results.append({
                "content": doc,
                "metadata": metadata,
                "similarity_score": 1 - distance,  # Convert distance to similarity
                "rank": i + 1
            })
        
        logger.debug(f"Knowledge base search completed: {len(search_results)} documents found")
        return search_results
        
    except Exception as e:
        logger.error(f"Error searching knowledge base: {str(e)}")
        return []

def cleanup_collection(collection):
    """Clean up temporary collection after use"""
    try:
        if collection:
            chroma_client.delete_collection(collection.name)
            logger.debug(f"Cleaned up temporary collection: {collection.name}")
    except Exception as e:
        logger.error(f"Error cleaning up collection: {str(e)}")

def sanitize_ai_output(text: str) -> str:

    try:
        s = text.lstrip()
        s = re.sub(r'^(Certainly|Sure|Of course|Absolutely|Great|Okay|Ok|No problem|当然|没问题|好的)[!,.，。]?\s+', '', s, flags=re.IGNORECASE)
        s = re.sub(r'^(Below (is|are)|Here (is|are)|以下为)\b[^\n]*\n+', '', s, flags=re.IGNORECASE)
        # Remove embedded reference lines in the answer (English/Chinese; case-insensitive; supports full-width colon)
        s = re.sub(r'(?mi)^\s*References?\s*[:：].*$', '', s)
        s = re.sub(r'(?mi)^\s*(参考信息|参考|引用|参考资料)\s*[:：].*$', '', s)
        s = re.sub(r'\n{3,}', '\n\n', s)
        return s.strip()
    except Exception:
        return text

def _load_prompt_config_safely():
    """
    Lazy import to avoid circular dependencies. Returns {} if unavailable.
    """
    try:
        import auth  # lazy import
        return auth.get_prompts()
    except Exception:
        return {}

def generate_ai_response(query: str, querytype: str, context_docs: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate AI response based on query and context documents"""
    try:
        # Prepare context from retrieved documents
        context_text = "\n\n".join([
            f"[Page {doc['metadata']['page']} from {doc['metadata']['source']}]\n{doc['content']}"
            for doc in context_docs
        ])
        
        # ==== Admin Prompt: choose system prompt based on config ====
        prompt_cfg = _load_prompt_config_safely() or {}
        mode = str(prompt_cfg.get("prompt_mode", "type_specific")).strip()

        # Default built-in fallback to avoid degradation when config is empty
        default_hint = (
            "You are a professional document analysis assistant.\n"
            "Query Type: Hint Analysis.\n"
            "For each evidence item, provide separate analysis with 'Evidence' and 'Analysis' sections.\n"
            "Answer only based on provided documents."
        )
        default_aet = (
            "You are a professional document analysis assistant.\n"
            "Focus on AET-related evidence from provided documents.\n"
            "Answer only based on provided documents."
        )
        default_general = (
            "You are a professional document analysis assistant.\n"
            "Answer only based on provided documents."
        )

        hint_prompt = (prompt_cfg.get("prompt_hint") or "").strip() or default_hint
        aet_prompt = (prompt_cfg.get("prompt_aet") or "").strip() or default_aet
        general_prompt = (prompt_cfg.get("prompt_general") or "").strip() or default_general

        qt = str(querytype or "").lower()
        if mode == "general_only":
            chosen_prompt = general_prompt
        elif mode == "fallback_general":
            if qt == "hint":
                chosen_prompt = hint_prompt or general_prompt
            elif qt == "aet":
                chosen_prompt = aet_prompt or general_prompt
            else:
                chosen_prompt = general_prompt
        else:  # type_specific
            if qt == "hint":
                chosen_prompt = hint_prompt
            elif qt == "aet":
                chosen_prompt = aet_prompt
            else:
                chosen_prompt = general_prompt

        # Hard constraints and tone: always append; ensure no inline references
        base_policy = """
General Requirements:
1. Answer questions based only on the provided document content.
2. If there is no relevant information, state this clearly.
3. Do NOT include any inline references or page numbers (no "Reference:" lines); references will be handled separately.
4. Keep answers accurate, concise, and well-organized.

Tone and Style Policy:
1. Audience: supplier audit professionals; use a formal, objectivetype_specific, compliance-oriented tone suitable for audit reports.
2. Start directly with findings; avoid conversational openers such as "Certainly", "Sure", "Of course", "Absolutely", "好的", "没问题", "当然".
3. No greetings, exclamation marks, emojis, marketing language, or chitchat.
4. Prefer neutral, impersonal phrasing; avoid first/second-person.
5. Maintain consistent terminology and structured layout (headings or bullets if needed).
6. Language: match the user's input language. If Chinese, use formal business Chinese.
"""
        system_message = SystemMessage(content=f"{chosen_prompt}\n\n{base_policy}")
        # ==== End Admin Prompt ====
        
        human_message = HumanMessage(content=f"""
Answer the question based on the following document content:
Query Type:
{querytype}

Document Content:   
{context_text}

Question: {query}

Provide a detailed answer only. Do NOT include any inline references or page numbers in the answer (no "Reference:" sections). 
Use a formal, objectivetype_specific, compliance-oriented tone suitable for audit reports. Start directly with the findings.
Avoid any conversational openers (e.g., "Certainly", "Sure", "Of course", "好的", "当然") and do not include greetings or exclamation marks.
""")
        
        logger.info(f"AI query processing started: {query[:100]}{'...' if len(query) > 100 else ''}")
        logger.debug(f"Context documents: {len(context_docs)}")

        # Create dynamic LLM client based on current configuration
        client = get_llm_client()
        # Log actual model and temperature used for troubleshooting
        try:
            # ChatOpenAI object attribute names and implementation may differ, this is for logging display only
            logger.info(f"Calling AI - Model: {client.model_name if hasattr(client, 'model_name') else 'N/A'}, Temperature: {get_current_temperature()}, QueryType: {querytype}")
        except Exception:
            pass
        
        # ===== Token Stats: calculate input tokens before API call =====
        try:
            from token_utils import num_tokens_from_messages, log_token_usage
            import tiktoken
        except Exception as _:
            num_tokens_from_messages = None
            tiktoken = None
            log_token_usage = None
    
        input_tokens = 0
        if num_tokens_from_messages:
            input_tokens = num_tokens_from_messages([system_message, human_message], "cl100k_base")
        # ===== End: input token statistics =====
        
        # Generate response using invoke method with retry mechanism
        max_retries = 6
        retry_count = 0
        last_exception = None
        
        while retry_count < max_retries:
            try:
                response = client.invoke([system_message, human_message])
                break  # Success, exit retry loop
            except Exception as e:
                error_str = str(e)
                
                # Check for specific API server errors that shouldn't be retried
                if "violations" in error_str and "KeyError" in error_str:
                    logger.error(f"API server configuration error: {error_str}")
                    return {
                        "answer": "Sorry, AI service is temporarily unavailable. Please try again later. If the problem persists, please contact technical support.",
                        "referenced_pages": [],
                        "context_used": False
                    }
                
                retry_count += 1
                last_exception = e
                logger.warning(f"AI API call failed (retry {retry_count}/{max_retries}): {error_str}")
                
                if retry_count < max_retries:
                    import time
                    time.sleep(1)  # Wait 1 second before retry
                else:
                    raise last_exception
        
        # Extract referenced pages
        referenced_pages = []
        for doc in context_docs:
            page_info = {
                "source": doc['metadata']['source'],
                "page": doc['metadata']['page'],
                "similarity_score": doc['similarity_score']
            }
            if page_info not in referenced_pages:
                referenced_pages.append(page_info)
        
        # Sanitize output
        answer_text = sanitize_ai_output(response.content)
    
        # ===== Token Stats: calculate output tokens after API call and write logs =====
        output_tokens = 0
        if tiktoken:
            try:
                encoder = tiktoken.get_encoding("cl100k_base")
                output_tokens = len(encoder.encode(str(answer_text)))
            except Exception as _:
                output_tokens = 0
    
        if log_token_usage:
            try:
                log_token_usage(MAX_AI_MODEL, input_tokens, output_tokens, "generate_ai_response")
            except Exception as _:
                pass
        # ===== End: output token statistics and logging =====
    
        result = {
            "answer": answer_text,
            "referenced_pages": referenced_pages,
            "context_used": len(context_docs) > 0,
            "tokens": {
                "input": input_tokens,
                "output": output_tokens
            }
        }
        
        logger.info(f"AI response generated successfully (length: {len(answer_text)} chars, pages: {len(referenced_pages)})")
        return result

    except Exception as e:
        logger.error(f"Error generating AI response: {str(e)}")
        return {
            "answer": "Error generating response. Please try again later.",
            "referenced_pages": [],
            "context_used": False
        }

def query_existing_knowledge_base(query: str, query_type: str = "general") -> Dict[str, Any]:
    """Query existing knowledge base without uploading new PDF"""
    try:
        # Check if collection exists
        collection_name = "pdf_knowledge_base"
        if not collection_exists(chroma_client, collection_name):
            return {
                "success": False,
                "error": "Knowledge base does not exist, please upload PDF file first"
            }
        
        # Get the existing collection
        collection = chroma_client.get_collection(
            name=collection_name,
            embedding_function=embedding_function
        )
        
        # Search for relevant documents
        relevant_docs = search_knowledge_base(query, collection)
        if not relevant_docs:
            return {
                "success": False,
                "error": "No relevant document content found"
            }
        
        # Generate AI response
        logger.info(f"Knowledge base query started ({query_type}): {len(relevant_docs)} relevant documents found")
        ai_response = generate_ai_response(query, query_type, relevant_docs)    
        
        return {
            "success": True,
            "answer": ai_response["answer"],
            "referenced_pages": ai_response["referenced_pages"],
            "relevant_docs_found": len(relevant_docs),
            "tokens": ai_response.get("tokens", {"input": 0, "output": 0})
        }
    except Exception as e:
        logger.error(f"Knowledge base query failed: {str(e)}")
        return {
            "success": False,
            "error": f"Error occurred during query process: {str(e)}"
        }

def process_pdf(pdf_bytes: bytes, filename: str) -> Dict[str, Any]:
    """Process PDF file and store in knowledge base without querying"""
    try:
        documents = load_pdf_from_bytes(pdf_bytes, filename)
        if not documents:
            return {
                "success": False,
                "error": "Unable to extract text content from PDF file"
            }
        
        if not store_documents_in_chromadb(documents):
            return {
                "success": False,
                "error": "Error storing documents to vector database"
            }
        
        return {
            "success": True,
            "documents_processed": len(documents)
        }
        
    except Exception as e:
        logger.error(f"PDF processing failed for {filename}: {str(e)}")
        return {
            "success": False,
            "error": f"Error occurred during processing: {str(e)}"
        }