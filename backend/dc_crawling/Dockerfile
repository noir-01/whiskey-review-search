FROM python:3.10.12-bullseye
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

# APT 설정 최적화
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY crawl.py gallery_master.py duplicate_monitor.py ./

CMD ["python", "crawl.py"]
