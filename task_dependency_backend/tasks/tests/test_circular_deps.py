from django.test import TestCase
from tasks.models import Task, TaskDependency
from tasks.services.dependency_checker import DependencyChecker


class CircularDependencyTestCase(TestCase):
    def setUp(self):
        """Create test tasks."""
        self.task_a = Task.objects.create(title="Task A")
        self.task_b = Task.objects.create(title="Task B")
        self.task_c = Task.objects.create(title="Task C")
        self.task_d = Task.objects.create(title="Task D")
    
    def test_self_dependency(self):
        """Task cannot depend on itself."""
        is_circular, path = DependencyChecker.check_circular_dependency(
            self.task_a.id, self.task_a.id
        )
        self.assertTrue(is_circular)
        self.assertEqual(path, [self.task_a.id, self.task_a.id])
    
    def test_direct_circular_dependency(self):
        """A → B, then B → A should be detected."""
        # A depends on B
        TaskDependency.objects.create(task=self.task_a, depends_on=self.task_b)
        
        # Check if B can depend on A (should be circular)
        is_circular, path = DependencyChecker.check_circular_dependency(
            self.task_b.id, self.task_a.id
        )
        self.assertTrue(is_circular)
    
    def test_indirect_circular_dependency(self):
        """A → B → C, then C → A should be detected."""
        # A depends on B
        TaskDependency.objects.create(task=self.task_a, depends_on=self.task_b)
        # B depends on C
        TaskDependency.objects.create(task=self.task_b, depends_on=self.task_c)
        
        # Check if C can depend on A (should be circular)
        is_circular, path = DependencyChecker.check_circular_dependency(
            self.task_c.id, self.task_a.id
        )
        self.assertTrue(is_circular)
    
    def test_no_circular_dependency(self):
        """A → B → C is valid, D → A is also valid."""
        # A depends on B
        TaskDependency.objects.create(task=self.task_a, depends_on=self.task_b)
        # B depends on C
        TaskDependency.objects.create(task=self.task_b, depends_on=self.task_c)
        
        # Check if D can depend on A (should be valid)
        is_circular, path = DependencyChecker.check_circular_dependency(
            self.task_d.id, self.task_a.id
        )
        self.assertFalse(is_circular)
        self.assertEqual(path, [])
    
    def test_complex_graph_no_cycle(self):
        """Complex dependency graph without cycles."""
        # A depends on B and C
        TaskDependency.objects.create(task=self.task_a, depends_on=self.task_b)
        TaskDependency.objects.create(task=self.task_a, depends_on=self.task_c)
        # B depends on D
        TaskDependency.objects.create(task=self.task_b, depends_on=self.task_d)
        # C depends on D
        TaskDependency.objects.create(task=self.task_c, depends_on=self.task_d)
        
        # Check if adding D → A would create a cycle
        is_circular, path = DependencyChecker.check_circular_dependency(
            self.task_d.id, self.task_a.id
        )
        self.assertTrue(is_circular)
