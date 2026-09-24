#use python 3.12
FROM python:3.12-slim

#set the working direcrtory inside the container
WORKDIR /app

#Copy requirements first
COPY requirements.txt .

#Install python dependencies
RUN pip install --no-cache-dir -r requirements.txt

#Copy the FASTAPI application
COPY app ./app

#FastAPI will run on the port 8000
EXPOSE 8000

#Start the FastAPI application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
