# CBI AI Audit Assistant
A local application with FastAPI backend and React frontend, supporting model configuration, prompt management, cost monitoring, and model catalog browsing.

## Quick Start (Development)
Backend (Python 3.12)

Create and activate a virtual environment, install dependencies:
pip install -r requirements.txt
Copy .env.example to .env, fill in your MAX_AI_URL/MAX_API_KEY
Run the backend:
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000
Frontend (Node 18+)

Enter frontend, install dependencies:
npm install
Copy frontend/.env.example to frontend/.env
Development mode (optional):
npm start
Production build:
npm run build
Access

Open http://localhost:8000 in your browser
API Documentation: http://localhost:8000/docs
## Deployment and Build
Frontend build resources will be mounted by the backend static service (frontend/build)
GitHub Actions can be configured for CI builds and basic checks
## Environment Variables
Backend: MAX_AI_URL, MAX_API_KEY, MAX_AI_MODEL, AI_TEMPERATURE
Frontend: REACT_APP_API_BASE_URL
## Security and Privacy
Do not commit .env, logs, vector database data, or private user database (src/auth_users.db)
All secrets should be injected through environment variables
## License
If open-sourcing, add an appropriate LICENSE (MIT/Apache-2.0, etc.) in the repository root, and be sure to remove or standardize company and personal information in file headers