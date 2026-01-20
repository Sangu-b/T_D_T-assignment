import React from 'react';
import { STATUS_COLORS, STATUS_LABELS } from '../utils/constants';

function StatusBadge({ status }) {
  const bgColor = {
    pending: 'bg-gray-400',
    in_progress: 'bg-blue-500',
    completed: 'bg-green-500',
    blocked: 'bg-red-500'
  };

  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-semibold text-white rounded ${bgColor[status] || 'bg-gray-400'}`}
      style={{ backgroundColor: STATUS_COLORS[status] }}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export default StatusBadge;
