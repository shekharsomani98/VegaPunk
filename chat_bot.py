import os
import re
import uuid
import time
from typing import List, Optional, Dict, Any
from urllib.parse import urlparse
from functools import lru_cache
from dotenv import load_dotenv
from collections import deque

# Load environment variables from .env file
load_dotenv()

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Set SSL certificate environment variables to disable verification for development
os.environ['SSL_CERT_FILE'] = ''
os.environ['SSL_CERT_DIR'] = ''
os.environ['REQUESTS_CA_BUNDLE'] = ''
os.environ['CURL_CA_BUNDLE'] = ''

from mistralai import Mistral
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_mistralai import MistralAIEmbeddings, ChatMistralAI
from langchain.schema import HumanMessage
from langchain_chroma import Chroma
from langchain_community.cache import InMemoryCache
from langchain_core.globals import set_llm_cache

# Enable caching for better performance
set_llm_cache(InMemoryCache())

# Environment variables
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
if not MISTRAL_API_KEY:
    raise ValueError("MISTRAL_API_KEY environment variable is required")

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
MAX_COLLECTIONS = int(os.getenv("MAX_COLLECTIONS", "4"))

# Initialize clients
mistral_client = Mistral(api_key=MISTRAL_API_KEY)
embeddings = MistralAIEmbeddings()

# Collection tracking
collections = deque(maxlen=MAX_COLLECTIONS)
active_collections = {}  # Maps collection_name to vectorstore

# Initialize FastAPI
app = FastAPI(title="Mistral RAG Chatbot for Research Papers")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# RAG LLM setup
LLM_MODEL = os.getenv("MISTRAL_MODEL", "mistral-large-latest")
llm = ChatMistralAI(model=LLM_MODEL, temperature=0.3)

# Enhanced prompt template
RAG_PROMPT = (
    "You are an expert research assistant for explaining concepts in documents.\n"
    "When answering a question, provide a comprehensive yet concise response.\n"
    "Use the retrieved context to support your explanations. If information is missing or unclear, say so.\n"
    "When appropriate, include relevant equations, code examples, or implementation details.\n\n"
    "Question: {question}\n\n"
    "Context:\n{context}\n\n"
    "Answer:"
)

# Chat history management
class ChatHistory:
    def __init__(self, max_history=10):
        self.history = {}
        self.max_history = max_history
    
    def add_message(self, session_id: str, role: str, content: str):
        if session_id not in self.history:
            self.history[session_id] = []
        
        self.history[session_id].append({"role": role, "content": content})
        
        # Trim history if needed
        if len(self.history[session_id]) > self.max_history * 2:  # *2 to count both user and assistant messages
            self.history[session_id] = self.history[session_id][-self.max_history * 2:]
    
    def get_messages(self, session_id: str):
        return self.history.get(session_id, [])

chat_history = ChatHistory()

# Request and Response models
class QueryRequest(BaseModel):
    question: str
    session_id: Optional[str] = None
    collection_names: Optional[List[str]] = None
    k: Optional[int] = 5

class QueryResponse(BaseModel):
    answer: str
    source_docs: List[Dict[str, Any]]

class CollectionInfo(BaseModel):
    name: str
    document_name: str
    created_at: float

class CollectionsResponse(BaseModel):
    collections: List[CollectionInfo]

def sanitize_filename(name: str) -> str:
    """Convert a string into a safe filename/collection name."""
    # Remove invalid characters and replace spaces with underscores
    name = re.sub(r'[^\w\s-]', '', name.lower())
    name = re.sub(r'[\s]+', '_', name)
    return name[:50]  # Limit length

def get_collection_name(url_or_filename: str) -> str:
    """Generate a collection name from URL or filename."""
    if url_or_filename.startswith(('http://', 'https://')):
        # Handle URL
        parsed = urlparse(url_or_filename)
        path = parsed.path
        filename = os.path.basename(path) if path else parsed.netloc
        base_name = os.path.splitext(filename)[0] if '.' in filename else filename
    else:
        # Handle filename
        base_name = os.path.splitext(url_or_filename)[0]
    
    sanitized = sanitize_filename(base_name)
    timestamp = int(time.time())
    return f"{sanitized}_{timestamp}"

def get_or_create_vectorstore(collection_name: str) -> Chroma:
    """Get existing vectorstore or create a new one for the collection."""
    if collection_name in active_collections:
        return active_collections[collection_name]
    
    # Create new vectorstore
    vectorstore = Chroma(
        persist_directory=os.path.join(CHROMA_PERSIST_DIR, collection_name),
        embedding_function=embeddings,
        collection_name=collection_name
    )
    
    # Add to collections tracking
    collection_info = {"name": collection_name, "created_at": time.time()}
    collections.append(collection_info)
    active_collections[collection_name] = vectorstore
    
    # If we have too many collections, remove the oldest one
    if len(collections) >= MAX_COLLECTIONS:
        oldest = collections[0]["name"]
        if oldest in active_collections:
            del active_collections[oldest]
    
    return vectorstore

def perform_ocr_from_url(url: str) -> str:
    """Call Mistral OCR and extract markdown if available, else fallback to plain text blocks."""
    resp = mistral_client.ocr.process(
        model="mistral-ocr-latest",
        document={"type": "document_url", "document_url": url},
        include_image_base64=False
    )
    contents: List[str] = []
    # If response has markdown pages
    for page in getattr(resp, "pages", []):
        md = getattr(page, "markdown", None)
        if md:
            contents.append(md)
        else:
            # fallback to blocks
            for block in getattr(page, "blocks", []):
                text = getattr(block, "text", None)
                if text:
                    contents.append(text)
    return "\n\n".join(contents)

def ingest_text(text: str, collection_name: str, source_metadata: dict) -> int:
    """Ingest text into a specified collection with source metadata."""
    vectorstore = get_or_create_vectorstore(collection_name)
    
    # More efficient chunking for better performance
    splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
        chunk_size=1200,  # Slightly larger chunks for fewer database operations
        chunk_overlap=150  # Reduced overlap for performance
    )
    
    # Create docs with source metadata
    docs = splitter.create_documents([text], metadatas=[source_metadata])
    
    # Add docs in batches for better performance
    vectorstore.add_documents(docs)
    
    return len(docs)

@app.post("/ingest/url")
async def ingest_url(document_url: str = Form(...)):
    try:
        start_time = time.time()
        
        # Generate collection name from URL
        collection_name = get_collection_name(document_url)
        
        # Extract text using OCR
        text = perform_ocr_from_url(document_url)
        
        # Source metadata
        source_metadata = {
            "source": document_url,
            "type": "url",
            "title": urlparse(document_url).path.split("/")[-1],
            "ingested_at": time.time()
        }
        
        # Ingest text
        chunks = ingest_text(text, collection_name, source_metadata)
        
        processing_time = time.time() - start_time
        
        return {
            "status": "success", 
            "chunks": chunks, 
            "collection_name": collection_name,
            "processing_time_seconds": processing_time
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ingest/file")
async def ingest_file(file: UploadFile = File(...)):
    try:
        start_time = time.time()
        
        # Generate collection name from filename
        collection_name = get_collection_name(file.filename)
        
        # Upload to Mistral for OCR
        uploaded = mistral_client.files.upload(
            file={"file_name": file.filename, "content": await file.read()},
            purpose="ocr"
        )
        signed = mistral_client.files.get_signed_url(file_id=uploaded.id)
        
        # Extract text using OCR
        text = perform_ocr_from_url(signed.url)
        
        # Source metadata
        source_metadata = {
            "source": file.filename,
            "type": "file",
            "title": file.filename,
            "ingested_at": time.time(),
            "file_id": uploaded.id
        }
        
        # Ingest text
        chunks = ingest_text(text, collection_name, source_metadata)
        
        processing_time = time.time() - start_time
        
        return {
            "status": "success", 
            "chunks": chunks, 
            "collection_name": collection_name,
            "processing_time_seconds": processing_time
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@lru_cache(maxsize=50)
def get_cached_retrieval(question: str, collection_name: str, k: int):
    """Cache retrieval results for better performance."""
    vectorstore = get_or_create_vectorstore(collection_name)
    retriever = vectorstore.as_retriever(search_kwargs={"k": k})
    return retriever.invoke(question)

@app.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest):
    try:
        start_time = time.time()
        
        # Generate session ID if not provided
        session_id = request.session_id or str(uuid.uuid4())
        
        # Add user message to history
        chat_history.add_message(session_id, "user", request.question)
        
        # Determine which collections to search
        collections_to_search = request.collection_names or [c["name"] for c in collections]
        
        # Get documents from each collection
        all_docs = []
        for collection_name in collections_to_search:
            try:
                docs = get_cached_retrieval(request.question, collection_name, request.k)
                all_docs.extend(docs)
            except Exception as e:
                print(f"Error retrieving from collection {collection_name}: {e}")
        
        # Sort documents by relevance (assuming most relevant first)
        # This assumes the retriever returns most relevant first
        all_docs = all_docs[:request.k]
        
        if not all_docs:
            return QueryResponse(
                answer="I couldn't find any relevant information to answer your question. Please try a different question or upload more documents.",
                source_docs=[]
            )
        
        # Create context from documents
        context = "\n\n".join([f"Source: {doc.metadata.get('source', 'Unknown')}\n{doc.page_content}" for doc in all_docs])
        
        # Format prompt with context
        prompt = RAG_PROMPT.format(context=context, question=request.question)
        
        # Get answer from LLM
        result = llm.invoke([HumanMessage(content=prompt)])
        answer = str(result.content).strip()
        
        # Add assistant message to history
        chat_history.add_message(session_id, "assistant", answer)
        
        # Format source documents for response
        source_docs = []
        for doc in all_docs:
            source_docs.append({
                "source": doc.metadata.get("source", "Unknown"),
                "type": doc.metadata.get("type", "Unknown"),
                "title": doc.metadata.get("title", "Unknown"),
                "content_preview": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content
            })
        
        processing_time = time.time() - start_time
        print(f"Query processed in {processing_time:.2f} seconds")
        
        return QueryResponse(
            answer=answer,
            source_docs=source_docs
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(
    question: str,
    session_id: Optional[str] = None,
    collection_names: Optional[str] = Query(None),
    k: int = 5
):
    """Simplified chat endpoint with query parameters."""
    # Parse collection names if provided
    collections = collection_names.split(",") if collection_names else None
    
    # Create request object
    request = QueryRequest(
        question=question,
        session_id=session_id,
        collection_names=collections,
        k=k
    )
    
    # Call query endpoint
    return await query(request)

@app.post("/chat_by_url")
async def chat_by_url(
    question: str,
    document_url: str,
    session_id: Optional[str] = None,
    k: int = 5
):
    """Process a document URL and then answer questions about it."""
    try:
        # First, check if we already have a collection for this URL
        # Generate a deterministic collection name from the URL
        collection_name = get_collection_name(document_url)
        
        # Check if this URL has already been processed
        url_collection_exists = False
        for coll in collections:
            if coll["name"].startswith(collection_name.split("_")[0]):
                url_collection_exists = True
                collection_name = coll["name"]
                break
        
        # If not processed, ingest the document
        if not url_collection_exists:
            print(f"Ingesting new document from URL: {document_url}")
            # Extract text using OCR
            text = perform_ocr_from_url(document_url)
            
            # Source metadata
            source_metadata = {
                "source": document_url,
                "type": "url",
                "title": urlparse(document_url).path.split("/")[-1],
                "ingested_at": time.time()
            }
            
            # Ingest text
            chunks = ingest_text(text, collection_name, source_metadata)
            print(f"Ingested document with {chunks} chunks into collection: {collection_name}")
        else:
            print(f"Using existing collection for URL: {collection_name}")
        
        # Now create request for chat query
        request = QueryRequest(
            question=question,
            session_id=session_id,
            collection_names=[collection_name],
            k=k
        )
        
        # Call query endpoint
        return await query(request)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/collections", response_model=CollectionsResponse)
async def list_collections():
    """Get list of available collections."""
    collection_info = []
    for coll in collections:
        collection_info.append(CollectionInfo(
            name=coll["name"],
            document_name=coll["name"].split("_")[0],
            created_at=coll.get("created_at", 0)
        ))
    
    return CollectionsResponse(collections=collection_info)

@app.get("/health")
def health_check():
    return {"status": "ok", "collections_count": len(collections)}

@app.post("/init_session")
async def init_session():
    """Initialize a new chat session and return a session ID."""
    session_id = str(uuid.uuid4())
    return {"session_id": session_id}

# Run the server if this file is executed directly
if __name__ == "__main__":
    import uvicorn
    port = 8003
    print(f"Starting chatbot server on port {port}...")
    uvicorn.run("chat_bot:app", host="0.0.0.0", port=port, reload=True)