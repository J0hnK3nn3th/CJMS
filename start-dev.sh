#!/bin/bash

echo "Starting CJMS Development Environment..."
echo

echo "Installing Python dependencies..."
pip install -r requirements.txt
echo

echo "Running Django migrations..."
python manage.py makemigrations
python manage.py migrate
echo

echo "Starting Django development server..."
python manage.py runserver &
DJANGO_PID=$!
echo

echo "Installing Node.js dependencies and starting React development server..."
cd frontend
npm install
npm start &
REACT_PID=$!
echo

echo "Both servers are starting..."
echo "Django backend: http://localhost:8000"
echo "React frontend: http://localhost:3000"
echo

# Function to cleanup background processes
cleanup() {
    echo "Stopping servers..."
    kill $DJANGO_PID 2>/dev/null
    kill $REACT_PID 2>/dev/null
    exit
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to press Ctrl+C
wait

