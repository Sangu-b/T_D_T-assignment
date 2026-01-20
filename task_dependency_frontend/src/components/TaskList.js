import React from 'react';
import TaskItem from './TaskItem';

function TaskList({ tasks, loading, onUpdateTask, onDeleteTask, onAddDependency, onRemoveDependency, onRefresh }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8 text-gray-500">
          Loading tasks...
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No tasks yet. Create your first task!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Tasks ({tasks.length})
        </h2>
        <button
          onClick={onRefresh}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          Refresh
        </button>
      </div>
      
      <div>
        {tasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            allTasks={tasks}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
            onAddDependency={onAddDependency}
            onRemoveDependency={onRemoveDependency}
          />
        ))}
      </div>
    </div>
  );
}

export default TaskList;
