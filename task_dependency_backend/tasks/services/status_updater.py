from tasks.models import Task, TaskDependency


class StatusUpdater:
    @staticmethod
    def update_task_status(task):
        """Update a single task's status based on its dependencies."""
        # Get all tasks this task depends on
        dependencies = TaskDependency.objects.filter(
            task=task
        ).select_related('depends_on')
        
        # No dependencies = user-controlled status
        if not dependencies.exists():
            return
        
        dependency_statuses = [dep.depends_on.status for dep in dependencies]
        
        # Any blocked dependency → task is blocked
        if 'blocked' in dependency_statuses:
            if task.status != 'blocked':
                task.status = 'blocked'
                task.save(update_fields=['status', 'updated_at'])
            return
        
        # All completed → task is ready (in_progress)
        if all(s == 'completed' for s in dependency_statuses):
            # Don't override if already completed or in_progress
            if task.status not in ['completed', 'in_progress']:
                task.status = 'in_progress'
                task.save(update_fields=['status', 'updated_at'])
            return
        
        # Mixed states → pending
        if task.status not in ['completed', 'in_progress']:
            task.status = 'pending'
            task.save(update_fields=['status', 'updated_at'])
    
    @staticmethod
    def update_dependent_tasks(task, depth=0):
        """Update all tasks that depend on this task."""
        # Prevent infinite recursion
        if depth > 50:
            return
        
        # Find all tasks that have this task as a dependency
        dependent_task_ids = TaskDependency.objects.filter(
            depends_on=task
        ).values_list('task_id', flat=True)
        
        # Update each dependent task
        for task_id in dependent_task_ids:
            dependent_task = Task.objects.get(id=task_id)
            StatusUpdater.update_task_status(dependent_task)
            # Recursively update tasks that depend on the dependent task
            StatusUpdater.update_dependent_tasks(dependent_task, depth + 1)
