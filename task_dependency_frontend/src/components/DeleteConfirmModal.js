import React from 'react';

function DeleteConfirmModal({ isOpen, taskTitle, dependentTasks, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Cannot Delete Task
        </h3>
        
        <p className="text-gray-600 mb-4">
          The task "<strong>{taskTitle}</strong>" cannot be deleted because the following tasks depend on it:
        </p>
        
        {dependentTasks && dependentTasks.length > 0 && (
          <ul className="bg-gray-50 rounded p-3 mb-4">
            {dependentTasks.map(dep => (
              <li key={dep.id} className="text-sm text-gray-700">
                • {dep.title} (ID: {dep.id})
              </li>
            ))}
          </ul>
        )}
        
        <p className="text-sm text-gray-500 mb-4">
          Please remove these dependencies first before deleting this task.
        </p>
        
        <div className="flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;
