# Frontend build stage
FROM oven/bun:latest AS frontend
WORKDIR /app/frontend

# install
COPY ./src/frontend/package.json ./src/frontend/bun.lockb* ./
RUN bun install

# build
COPY ./src/frontend .

RUN bun run build

# Runtime stage
FROM python:3.12-slim AS runner
WORKDIR /app/lyrics-learning-note

RUN apt-get update && apt-get install -y \
    curl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
COPY ./src/lyrics-learning-note/pyproject.toml ./src/lyrics-learning-note/uv.lock ./
RUN uv sync --frozen --no-install-project

COPY ./src/lyrics-learning-note .
COPY --from=frontend /app/frontend/build /app/frontend/build

EXPOSE 1678
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "1678"]
# docker build -t lyrics-learning-note .
# docker run -d -p "1678:1678" -v "./src/lyrics-learning-note/data:/app/lyrics-learning-note/data" --name "lyrics-learning-note" lyrics-learning-note
