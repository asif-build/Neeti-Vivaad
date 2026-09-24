#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "Installing backend dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Collecting static assets with WhiteNoise..."
python manage.py collectstatic --noinput

echo "Applying database migrations..."
python manage.py migrate --noinput

echo "Build complete."
