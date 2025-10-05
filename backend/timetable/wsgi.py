"""
WSGI config for timetable project.

It exposes the WSGI callable as a module-level variable named ``application``.
"""

import os
from django.core.wsgi import get_wsgi_application

# Ensure this matches your project folder name
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'timetable.settings')

application = get_wsgi_application()
