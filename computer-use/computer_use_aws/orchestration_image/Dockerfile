FROM public.ecr.aws/docker/library/python:3.12.6-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    software-properties-common \
    git \
    && rm -rf /var/lib/apt/lists/*

COPY . .

COPY requirements.txt ./computer_use_demo/requirements.txt
RUN python -m pip install -r ./computer_use_demo/requirements.txt

# setup desktop env & app
COPY computer_use_demo/ ./computer_use_demo/

ARG DISPLAY_NUM=1
ARG HEIGHT=768
ARG WIDTH=1024
ENV DISPLAY_NUM=$DISPLAY_NUM
ENV HEIGHT=$HEIGHT
ENV WIDTH=$WIDTH
ENV API_PROVIDER=bedrock

EXPOSE 8501

HEALTHCHECK CMD curl --fail http://localhost:8501/_stcore/health

ENTRYPOINT ["streamlit", "run", "./computer_use_demo/streamlit.py", "--server.port=8501", "--server.address=0.0.0.0"]