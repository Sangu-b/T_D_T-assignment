export function validateTaskTitle(title) {
  if (!title || title.trim().length === 0) {
    return 'Title is required';
  }
  if (title.length > 200) {
    return 'Title must be less than 200 characters';
  }
  return null;
}

export function validateDependency(taskId, dependsOnId) {
  if (!dependsOnId) {
    return 'Please select a task to depend on';
  }
  if (taskId === dependsOnId) {
    return 'A task cannot depend on itself';
  }
  return null;
}
