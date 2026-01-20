export const STATUS_COLORS = {
  pending: '#9CA3AF',      // gray
  in_progress: '#3B82F6',  // blue
  completed: '#10B981',    // green
  blocked: '#EF4444'       // red
};

export const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  blocked: 'Blocked'
};

export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'blocked', label: 'Blocked' }
];
