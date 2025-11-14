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
    path('auth/judge-login/', views.judge_login_view, name='judge_login'),
    path('auth/verify-password/', views.verify_password_view, name='verify_password'),
    path('subevents/<int:subevent_id>/settings/', views.subevent_settings_view, name='subevent_settings'),
    path('judges/<int:judge_id>/scores/', views.judge_scores_view, name='judge_scores'),
    path('judges/<int:judge_id>/scores/save/', views.save_judge_scores_view, name='save_judge_scores'),
    path('', include(router.urls)),
]

