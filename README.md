# Lyrics Learning Note

## Before you run
Clone from /src/lyrics-learning-note/.env.example and rename it to /src/lyrics-learning-note/.env
Fill in data in .env file, e.g. api key


## To run it locally

### Requirement
- Python - 3.12

```bash

# install frontend dependencies
cd ./frontend
bun install
bun run build

# start server (port 1678, customizable)
cd ..
uv run uvicorn main:app --port 1678

```

## Docker
```bash

# path ./language-learning-note
docker build -t lyrics-learning-note .
docker run -d -p "1678:1678" -v "./src/lyrics-learning-note/data:/app/lyrics-learning-note/data" --name "lyrics-learning-note" lyrics-learning-note

```
