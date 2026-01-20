from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Task, TaskDependency
from .serializers import TaskSerializer, TaskDependencySerializer
from .services.dependency_checker import DependencyChecker


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    
    @action(detail=True, methods=['post'], url_path='dependencies')
    def add_dependency(self, request, pk=None):
        """
        POST /api/tasks/{id}/dependencies/
        Body: {"depends_on_id": 5}
        """
        task = self.get_object()
        depends_on_id = request.data.get('depends_on_id')
        
        if not depends_on_id:
            return Response(
                {"error": "depends_on_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if dependency exists
        try:
            depends_on_task = Task.objects.get(id=depends_on_id)
        except Task.DoesNotExist:
            return Response(
                {"error": "Dependency task not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check for circular dependency
        is_circular, cycle_path = DependencyChecker.check_circular_dependency(
            task.id,
            depends_on_id
        )
        
        if is_circular:
            return Response(
                {
                    "error": "Circular dependency detected",
                    "path": cycle_path
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the dependency
        dependency, created = TaskDependency.objects.get_or_create(
            task=task,
            depends_on=depends_on_task
        )
        
        if not created:
            return Response(
                {"error": "Dependency already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = TaskDependencySerializer(dependency)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['delete'], url_path='dependencies/(?P<dep_id>[^/.]+)')
    def remove_dependency(self, request, pk=None, dep_id=None):
        """
        DELETE /api/tasks/{id}/dependencies/{dep_id}/
        """
        task = self.get_object()
        
        try:
            dependency = TaskDependency.objects.get(
                task=task,
                depends_on_id=dep_id
            )
            dependency.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except TaskDependency.DoesNotExist:
            return Response(
                {"error": "Dependency not found"},
                status=status.HTTP_404_NOT_FOUND
            )
