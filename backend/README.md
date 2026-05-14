# FastAPI Backend

## Run locally

1. Install dependencies:

```bash
python3 -m pip install -r requirements.txt
```

2. Start the server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

3. Visit:

- http://localhost:8000/
- http://localhost:8000/health
- http://localhost:8000/docs

## Docker

Build and run with Docker Compose from the project root:

```bash
docker-compose up --build backend
```
