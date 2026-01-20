from rest_framework import serializers
from .models import Task, TaskDependency


class TaskDependencySerializer(serializers.ModelSerializer):
    depends_on_title = serializers.CharField(source='depends_on.title', read_only=True)
    depends_on_status = serializers.CharField(source='depends_on.status', read_only=True)
    
    class Meta:
        model = TaskDependency
        fields = ['id', 'depends_on', 'depends_on_title', 'depends_on_status', 'created_at']


class TaskSerializer(serializers.ModelSerializer):
    dependencies = TaskDependencySerializer(many=True, read_only=True)
    dependent_tasks = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status', 
            'created_at', 'updated_at', 'dependencies', 'dependent_tasks'
        ]
    
    def get_dependent_tasks(self, obj):
        return list(obj.dependent_tasks.values_list('task_id', flat=True))


class GraphSerializer(serializers.Serializer):
    nodes = serializers.SerializerMethodField()
    edges = serializers.SerializerMethodField()
    
    def get_nodes(self, obj):
        tasks = obj.get('tasks', [])
        return [
            {
                'id': task.id,
                'title': task.title,
                'status': task.status
            }
            for task in tasks
        ]
    
    def get_edges(self, obj):
        dependencies = obj.get('dependencies', [])
        return [
            {
                'from': dep.task_id,
                'to': dep.depends_on_id
            }
            for dep in dependencies
        ]
