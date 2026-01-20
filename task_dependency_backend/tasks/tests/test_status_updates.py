from django.test import TestCase
from tasks.models import Task, TaskDependency
from tasks.services.status_updater import StatusUpdater


class StatusUpdaterTestCase(TestCase):
    def setUp(self):
        """Create test tasks."""
        self.task_a = Task.objects.create(title="Task A", status="pending")
        self.task_b = Task.objects.create(title="Task B", status="pending")
        self.task_c = Task.objects.create(title="Task C", status="pending")
    
    def test_no_dependencies_no_change(self):
        """Task without dependencies keeps its status."""
        original_status = self.task_a.status
        StatusUpdater.update_task_status(self.task_a)
        self.task_a.refresh_from_db()
        self.assertEqual(self.task_a.status, original_status)
    
    def test_all_dependencies_completed_sets_in_progress(self):
        """When all dependencies are completed, task becomes in_progress."""
        # A depends on B
        TaskDependency.objects.create(task=self.task_a, depends_on=self.task_b)
        
        # Complete B
        self.task_b.status = 'completed'
        self.task_b.save()
        
        # Update A's status
        StatusUpdater.update_task_status(self.task_a)
        self.task_a.refresh_from_db()
        self.assertEqual(self.task_a.status, 'in_progress')
    
    def test_blocked_dependency_blocks_task(self):
        """When any dependency is blocked, task becomes blocked."""
        # A depends on B
        TaskDependency.objects.create(task=self.task_a, depends_on=self.task_b)
        
        # Block B
        self.task_b.status = 'blocked'
        self.task_b.save()
        
        # Update A's status
        StatusUpdater.update_task_status(self.task_a)
        self.task_a.refresh_from_db()
        self.assertEqual(self.task_a.status, 'blocked')
    
    def test_mixed_dependencies_stays_pending(self):
        """When dependencies have mixed statuses, task stays pending."""
        # A depends on B and C
        TaskDependency.objects.create(task=self.task_a, depends_on=self.task_b)
        TaskDependency.objects.create(task=self.task_a, depends_on=self.task_c)
        
        # Complete B but leave C pending
        self.task_b.status = 'completed'
        self.task_b.save()
        
        # Update A's status
        StatusUpdater.update_task_status(self.task_a)
        self.task_a.refresh_from_db()
        self.assertEqual(self.task_a.status, 'pending')
    
    def test_completed_task_not_overridden(self):
        """Already completed task should not change status."""
        # A depends on B
        TaskDependency.objects.create(task=self.task_a, depends_on=self.task_b)
        
        # Mark A as completed
        self.task_a.status = 'completed'
        self.task_a.save()
        
        # Update A's status (B is still pending)
        StatusUpdater.update_task_status(self.task_a)
        self.task_a.refresh_from_db()
        self.assertEqual(self.task_a.status, 'completed')
    
    def test_update_dependent_tasks_cascade(self):
        """Completing a task cascades status updates to dependent tasks."""
        # A depends on B, B depends on C
        TaskDependency.objects.create(task=self.task_a, depends_on=self.task_b)
        TaskDependency.objects.create(task=self.task_b, depends_on=self.task_c)
        
        # Complete C
        self.task_c.status = 'completed'
        self.task_c.save()
        
        # Update dependent tasks starting from C
        StatusUpdater.update_dependent_tasks(self.task_c)
        
        self.task_b.refresh_from_db()
        self.assertEqual(self.task_b.status, 'in_progress')
