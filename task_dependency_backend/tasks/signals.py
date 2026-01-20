from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from tasks.models import Task, TaskDependency
from tasks.services.status_updater import StatusUpdater


@receiver(post_save, sender=Task)
def task_status_changed(sender, instance, created, **kwargs):
    """When a task's status changes, update dependent tasks."""
    if created:
        # New task created - no need to update dependents
        return
    
    # If status changed to 'completed' or 'blocked', update dependent tasks
    if instance.status in ['completed', 'blocked']:
        StatusUpdater.update_dependent_tasks(instance)


@receiver(post_save, sender=TaskDependency)
def dependency_added(sender, instance, created, **kwargs):
    """When a dependency is added, update the task's status."""
    if created:
        StatusUpdater.update_task_status(instance.task)


@receiver(post_delete, sender=TaskDependency)
def dependency_removed(sender, instance, **kwargs):
    """When a dependency is removed, update the task's status."""
    StatusUpdater.update_task_status(instance.task)
