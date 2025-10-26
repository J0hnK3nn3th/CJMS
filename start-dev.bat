@echo off
echo Starting CJMS Development Environment...
echo.

echo Installing Python dependencies...
py -m pip install -r requirements.txt
echo.

echo Running Django migrations...
py manage.py makemigrations
py manage.py migrate
echo.

echo Starting Django development server...
start cmd /k "py manage.py runserver"
echo.

echo Starting React development server...
cd frontend
start cmd /k "npm install && npm start"
echo.

echo Both servers are starting...
echo Django backend: http://localhost:8000
echo React frontend: http://localhost:3000
echo.
pause
