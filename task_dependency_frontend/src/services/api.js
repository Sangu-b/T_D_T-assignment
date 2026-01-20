const API_BASE = 'http://localhost:8000/api';

export const api = {
  // Tasks
  getTasks: async () => {
    const response = await fetch(`${API_BASE}/tasks/`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  },
  
  createTask: async (data) => {
    const response = await fetch(`${API_BASE}/tasks/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  },
  
  updateTask: async (id, data) => {
    const response = await fetch(`${API_BASE}/tasks/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
  },
  
  deleteTask: async (id) => {
    const response = await fetch(`${API_BASE}/tasks/${id}/`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw error;
    }
    return response.ok;
  },
  
  // Dependencies
  addDependency: async (taskId, dependsOnId) => {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/dependencies/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ depends_on_id: dependsOnId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw error;
    }
    return response.json();
  },
  
  removeDependency: async (taskId, depId) => {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/dependencies/${depId}/`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove dependency');
    return response.ok;
  },
  
  // Graph
  getGraph: async () => {
    const response = await fetch(`${API_BASE}/dependencies/graph/`);
    if (!response.ok) throw new Error('Failed to fetch graph');
    return response.json();
  },
};
