from python:3.8
workdir /app
copy server/requirements.txt .
run pip install -r requirements.txt
copy server .
expose 80
cmd ["gunicorn", "main:main", "--bind", "0.0.0.0:80", "--worker-class", "aiohttp.GunicornWebWorker"]
