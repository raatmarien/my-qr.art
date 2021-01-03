#!/bin/bash
# This is pretty specific to my server
# You might need to change it for your set up

source /var/www/venv/bin/activate
cd /var/www/my_qr_art
git pull
python3 manage.py collectstatic --no-input
python3 manage.py migrate --no-input
systemctl restart apache2
