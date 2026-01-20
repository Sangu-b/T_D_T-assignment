from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, DependencyGraphView

router = DefaultRouter()
router.register(r'tasks', TaskViewSet)
router.register(r'dependencies', DependencyGraphView, basename='dependencies')

urlpatterns = [
    path('', include(router.urls)),
]
