FROM python:3.10.12-slim-bullseye
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY crawl.py gallery_master.py duplicate_monitor.py ./

CMD ["python", "crawl.py"]
