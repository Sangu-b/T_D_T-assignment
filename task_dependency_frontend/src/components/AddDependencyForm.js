import React, { useState } from 'react';
import { validateDependency } from '../utils/validators';

function AddDependencyForm({ tasks, onAddDependency }) {
  const [selectedTask, setSelectedTask] = useState('');
  const [selectedDependency, setSelectedDependency] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedTask) {
      setError('Please select a task');
      return;
    }

    const validationError = validateDependency(
      parseInt(selectedTask),
      parseInt(selectedDependency)
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onAddDependency(parseInt(selectedTask), parseInt(selectedDependency));
      setSelectedTask('');
      setSelectedDependency('');
    } catch (err) {
      if (err.error) {
        setError(err.error);
      } else {
        setError(err.message || 'Failed to add dependency');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Get available tasks for dependency (exclude selected task)
  const availableDependencies = selectedTask
    ? tasks.filter(t => t.id !== parseInt(selectedTask))
    : [];

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Dependency</h2>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="task" className="block text-sm font-medium text-gray-700 mb-1">
            Task *
          </label>
          <select
            id="task"
            value={selectedTask}
            onChange={(e) => {
              setSelectedTask(e.target.value);
              setSelectedDependency('');
              setError(null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={submitting}
          >
            <option value="">Select a task...</option>
            {tasks.map(task => (
              <option key={task.id} value={task.id}>
                {task.title} ({task.status})
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="dependency" className="block text-sm font-medium text-gray-700 mb-1">
            Depends On *
          </label>
          <select
            id="dependency"
            value={selectedDependency}
            onChange={(e) => {
              setSelectedDependency(e.target.value);
              setError(null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={submitting || !selectedTask}
          >
            <option value="">Select a dependency...</option>
            {availableDependencies.map(task => (
              <option key={task.id} value={task.id}>
                {task.title} ({task.status})
              </option>
            ))}
          </select>
          {selectedTask && availableDependencies.length === 0 && (
            <p className="text-sm text-gray-500 mt-1 italic">
              No other tasks available
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || !selectedTask || !selectedDependency}
          className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {submitting ? 'Adding...' : 'Add Dependency'}
        </button>
      </form>

      <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
        <strong>Note:</strong> Adding a dependency means the selected task will wait for the "depends on" task to complete.
      </div>
    </div>
  );
}

export default AddDependencyForm;
