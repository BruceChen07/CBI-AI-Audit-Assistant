<!--
Service Journey — Business Friendly
This page explains how the service works in a simple and visual way for business users.
Brand color palette (editable):
- Brand Primary: #6C5CE7
- Brand Secondary: #A8A4FF
- Surface: #F7F6FF
-->

<p align="center">
  <img alt="Brand Logo" src="../../images/CBI 智审未来 logo.png" width="220" />
</p>

<h1 align="center">Service Journey — Business Friendly</h1>
<p align="center" style="color:#6C5CE7;"><strong>Simple overview, business-first visuals, token & cost awareness</strong></p>

---

## A. Big Picture (Overview)

- You open the desktop app (hackathon-app.exe).
- A local web service starts on your computer (localhost:8000).
- The service directly serves the web page.
- You ask a question; the system retrieves relevant knowledge (RAG) and calls the AI model.
- The answer streams back to the page.
- Tokens are counted and costs are estimated automatically.

```mermaid
%%{init: {"theme":"base","themeVariables":{
  "fontFamily":"Inter, Segoe UI, Arial",
  "primaryColor":"#F7F6FF",
  "primaryTextColor":"#1F2341",
  "primaryBorderColor":"#6C5CE7",
  "lineColor":"#6C5CE7",
  "clusterBkg":"#F7F6FF",
  "tertiaryColor":"#A8A4FF"
}}}%%
flowchart LR
    U[User] --> EXE[Desktop App - hackathon-app.exe]
    EXE --> Svc[Local Web Service - FastAPI + Uvicorn]
    Svc --> FE[Frontend Static Files - index.html, JS, CSS]
    U --> FE
    U --> API[API - ask endpoint]
    API --> RAG[RAG - Retrieve Context - ChromaDB]
    RAG --> CH[Knowledge Base - Documents and Vectors]
    API --> LLM[LLM Provider - Cloud or Local]
    API --> TOK[Token and Cost Monitor]
    TOK --> REP[Reports and Logs]
    LLM --> API
    API --> FE
    FE --> U
```

---

## B. End-to-End Journey (Simple Sequence)

- User action → Web App → RAG → Model → Streaming answer.
- Token and cost are recorded during the process.

```mermaid
%%{init: {'theme':'neutral', 'sequence': {
  'mirrorActors': false,
  'showSequenceNumbers': true,
  'actorFontWeight': 700
}} }%%
sequenceDiagram
    autonumber
    actor User as User
    participant Browser as Web App (Browser)
    participant API as Backend API
    participant RAG as RAG Service
    participant VecDB as Vector DB (ChromaDB)
    participant LLM as LLM Provider
    participant Cost as Token & Cost Monitor

    User->>Browser: Type question and click "Send"
    Browser->>API: POST /api/ask { question }
    API->>RAG: Start retrieval (trace)
    RAG->>VecDB: Similarity search (top-K)
    VecDB-->>RAG: Relevant chunks
    RAG-->>API: Prompt = Question + Context

    API->>Cost: Record input tokens (prompt)
    API->>LLM: Call model (streaming)
    LLM-->>API: Stream output tokens
    API->>Cost: Record output tokens

    Cost-->>API: Calculate cost for this request
    API-->>Browser: Stream answer + meta (optional)
    Browser-->>User: Show streaming response
    API->>Cost: Persist session stats (for reports)
```

---

## C. Token & Cost Monitoring (Per Request)

- We measure “input tokens” (prompt) and “output tokens” (model response).
- Cost = price_in × (input_tokens/1K) + price_out × (output_tokens/1K).
- Pricing is configurable per model and can be updated anytime.
- Data can be aggregated by user, model, date, or project.

```mermaid
%%{init: {'theme':'forest', 'themeVariables': {
  'primaryColor': '#EDEBFE',
  'primaryBorderColor': '#6C5CE7',
  'lineColor': '#6C5CE7'
}}}%%
sequenceDiagram
    autonumber
    participant API as Backend API
    participant Meter as Token Meter
    participant Price as Price Config (per model)
    participant Store as Cost Store (Logs/CSV/DB)
    participant Dash as Cost Dashboard (optional)

    API->>Meter: count_input(prompt)
    Meter-->>API: input_tokens
    API->>LLM: request(prompt)
    LLM-->>API: stream(response)
    API->>Meter: count_output(stream)
    Meter-->>API: output_tokens

    API->>Price: get(model prices)
    Price-->>API: { in_per_1k, out_per_1k }
    API->>Store: save({ user, model, input_tokens, output_tokens, cost })
    Store-->>Dash: aggregated metrics (by time/model/user)
```

---

## D. System Startup & Static Site Serving

- The program starts a local service; you open the browser yourself.
- The page and assets are served locally for a smooth experience.
- FastAPI also provides a handy API page at /docs.

```mermaid
%%{init: {'theme':'base', 'themeVariables': {
  'primaryColor': '#FAFAFF',
  'primaryBorderColor': '#6C5CE7',
  'lineColor': '#6C5CE7'
}}}%%
sequenceDiagram
    autonumber
    actor User as User
    participant EXE as Desktop App
    participant Svc as FastAPI + Uvicorn
    participant FE as Static Files (frontend/build)
    participant Browser as Browser

    User->>EXE: Double-click to open
    EXE->>Svc: Start server on 0.0.0.0:8000
    Note right of Svc: Mount static: "/" and "/static"
    User->>Browser: Open http://localhost:8000
    Browser->>Svc: GET /
    Svc-->>Browser: index.html + JS/CSS
    Browser-->>User: Page rendered (ready to use)
```

---

## E. Failure & Recovery (Business View)

- If the model or network fails, the system shows a friendly message and logs details for support.
- Your data and previous sessions remain safe.

```mermaid
%%{init: {'theme':'base', 'themeVariables': {
  'primaryColor': '#FFF7F9',
  'primaryBorderColor': '#E5647A',
  'lineColor': '#E5647A'
}}}%%
sequenceDiagram
    autonumber
    participant Browser as Web App
    participant API as Backend API
    participant LLM as LLM Provider
    participant Log as Logs
    participant Tips as UI Notice

    Browser->>API: Ask question
    API->>LLM: Call model
    LLM-->>API: Error / Timeout (example)
    API->>Log: write(error, request_id, user)
    API-->>Browser: Friendly error response
    Browser->>Tips: Show guidance (retry / check setting)
```

---

## Quick Reminders (for Business Users)

- Open the app, then visit: http://localhost:8000
- API reference (for internal use): http://localhost:8000/docs
- Costs are tracked automatically by tokens and model price.
- Reports can be exported and viewed as dashboards.

<p align="right" style="color:#6C5CE7;"><em>Brand color: #6C5CE7 (editable)</em></p>