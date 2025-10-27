from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'cases', views.CaseViewSet)
router.register(r'notes', views.CaseNoteViewSet)
router.register(r'files', views.CaseFileViewSet)
router.register(r'events', views.EventViewSet)
router.register(r'subevents', views.SubEventViewSet)

urlpatterns = [
    path('auth/login/', views.login_view, name='api_login'),
    path('auth/verify-password/', views.verify_password_view, name='verify_password'),
    path('', include(router.urls)),
]

