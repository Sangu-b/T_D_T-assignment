import React from 'react';

function ErrorMessage({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
      <span>{message}</span>
      <button
        onClick={onDismiss}
        className="font-bold text-red-700 hover:text-red-900 text-xl leading-none"
      >
        ×
      </button>
    </div>
  );
}

export default ErrorMessage;
