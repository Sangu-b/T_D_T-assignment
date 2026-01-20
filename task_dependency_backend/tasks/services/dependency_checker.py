from tasks.models import Task, TaskDependency


class DependencyChecker:
    @staticmethod
    def check_circular_dependency(task_id, depends_on_id):
        """
        Detect circular dependencies using DFS.
        Returns: (is_circular: bool, cycle_path: list)
        """
        # Edge case: Task cannot depend on itself
        if task_id == depends_on_id:
            return (True, [task_id, task_id])
        
        visited = set()
        path = []
        
        def dfs(current_id):
            # Found cycle - we've reached the original task
            if current_id == task_id:
                path.append(current_id)
                return True
            
            # Already explored this path
            if current_id in visited:
                return False
            
            visited.add(current_id)
            path.append(current_id)
            
            # Get all dependencies of current task
            dependencies = TaskDependency.objects.filter(
                task_id=current_id
            ).values_list('depends_on_id', flat=True)
            
            # Recursively check each dependency
            for dep_id in dependencies:
                if dfs(dep_id):
                    return True
            
            # Backtrack
            path.pop()
            visited.remove(current_id)
            return False
        
        # Start DFS from the proposed dependency
        has_cycle = dfs(depends_on_id)
        return (has_cycle, path if has_cycle else [])
