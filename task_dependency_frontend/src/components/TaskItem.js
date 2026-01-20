import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import { STATUS_OPTIONS } from '../utils/constants';

function TaskItem({ task, onUpdateTask, onDeleteTask, allTasks, onAddDependency, onRemoveDependency }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDependency, setSelectedDependency] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      await onUpdateTask(task.id, { status: newStatus });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddDependency = async () => {
    if (!selectedDependency) return;
    
    setIsUpdating(true);
    try {
      await onAddDependency(task.id, parseInt(selectedDependency));
      setSelectedDependency('');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveDependency = async (depId) => {
    setIsUpdating(true);
    try {
      await onRemoveDependency(task.id, depId);
    } finally {
      setIsUpdating(false);
    }
  };

  // Get available tasks for dependency (exclude self and existing dependencies)
  const existingDepIds = task.dependencies?.map(d => d.depends_on) || [];
  const availableTasks = allTasks.filter(
    t => t.id !== task.id && !existingDepIds.includes(t.id)
  );

  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-3 bg-white">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-medium text-gray-800">{task.title}</h3>
            <StatusBadge status={task.status} />
          </div>
          {task.description && (
            <p className="text-gray-600 text-sm mt-1">{task.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            ID: {task.id} | Dependencies: {task.dependencies?.length || 0}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
          <button
            onClick={() => onDeleteTask(task.id)}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
            disabled={isUpdating}
          >
            Delete
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {/* Status Update */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Status:
            </label>
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  disabled={isUpdating || task.status === option.value}
                  className={`px-3 py-1 text-sm rounded ${
                    task.status === option.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Current Dependencies */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dependencies (this task depends on):
            </label>
            {task.dependencies?.length > 0 ? (
              <ul className="space-y-1">
                {task.dependencies.map(dep => (
                  <li key={dep.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                    <span className="text-sm">
                      {dep.depends_on_title} 
                      <StatusBadge status={dep.depends_on_status} />
                    </span>
                    <button
                      onClick={() => handleRemoveDependency(dep.depends_on)}
                      disabled={isUpdating}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">No dependencies</p>
            )}
          </div>

          {/* Add Dependency */}
          {availableTasks.length > 0 && (
            <div className="flex gap-2">
              <select
                value={selectedDependency}
                onChange={(e) => setSelectedDependency(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                disabled={isUpdating}
              >
                <option value="">Select a task to depend on...</option>
                {availableTasks.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.status})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddDependency}
                disabled={!selectedDependency || isUpdating}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 text-sm"
              >
                Add
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TaskItem;
