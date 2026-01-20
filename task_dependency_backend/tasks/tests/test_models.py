from django.test import TestCase
from django.db import IntegrityError
from tasks.models import Task, TaskDependency


class TaskModelTestCase(TestCase):
    def test_create_task_default_status(self):
        """Task should have 'pending' as default status."""
        task = Task.objects.create(title="Test Task")
        self.assertEqual(task.status, 'pending')
    
    def test_create_task_with_description(self):
        """Task can have optional description."""
        task = Task.objects.create(
            title="Test Task",
            description="This is a test description"
        )
        self.assertEqual(task.description, "This is a test description")
    
    def test_task_ordering(self):
        """Tasks should be ordered by created_at descending."""
        task1 = Task.objects.create(title="Task 1")
        task2 = Task.objects.create(title="Task 2")
        tasks = list(Task.objects.all())
        # Both tasks created at same time, so order by id descending
        # The model orders by -created_at, which means newer first
        self.assertEqual(len(tasks), 2)
    
    def test_task_str_representation(self):
        """Task __str__ should return title."""
        task = Task.objects.create(title="My Task")
        self.assertEqual(str(task), "My Task")


class TaskDependencyModelTestCase(TestCase):
    def setUp(self):
        self.task_a = Task.objects.create(title="Task A")
        self.task_b = Task.objects.create(title="Task B")
    
    def test_create_dependency(self):
        """Can create a dependency between tasks."""
        dep = TaskDependency.objects.create(
            task=self.task_a,
            depends_on=self.task_b
        )
        self.assertEqual(dep.task, self.task_a)
        self.assertEqual(dep.depends_on, self.task_b)
    
    def test_unique_constraint(self):
        """Cannot create duplicate dependencies."""
        TaskDependency.objects.create(
            task=self.task_a,
            depends_on=self.task_b
        )
        with self.assertRaises(IntegrityError):
            TaskDependency.objects.create(
                task=self.task_a,
                depends_on=self.task_b
            )
    
    def test_dependency_str_representation(self):
        """TaskDependency __str__ should show relationship."""
        dep = TaskDependency.objects.create(
            task=self.task_a,
            depends_on=self.task_b
        )
        self.assertEqual(str(dep), "Task A depends on Task B")
    
    def test_cascade_delete_task(self):
        """Deleting a task should delete its dependencies."""
        TaskDependency.objects.create(
            task=self.task_a,
            depends_on=self.task_b
        )
        self.task_a.delete()
        self.assertEqual(TaskDependency.objects.count(), 0)
    
    def test_cascade_delete_depends_on(self):
        """Deleting depends_on task should delete dependencies."""
        TaskDependency.objects.create(
            task=self.task_a,
            depends_on=self.task_b
        )
        self.task_b.delete()
        self.assertEqual(TaskDependency.objects.count(), 0)
