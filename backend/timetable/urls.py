from django.contrib import admin
from django.urls import path, include
from . import views  # import your home view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),  # keep your api routes
    path('', views.home, name='home'),  # 👈 root path
]
    