FROM python:3.12-slim
WORKDIR /app
RUN pip install --no-cache-dir celery redis
COPY worker.py .
CMD ["celery", "-A", "worker", "worker", "--loglevel=info", "--concurrency=2"]
