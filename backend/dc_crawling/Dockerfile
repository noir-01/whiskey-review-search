FROM python:3.10.12-bullseye
WORKDIR /usr/src/app
COPY crawl.py .
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

# APT 설정 최적화
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

CMD ["python", "crawl.py"]