import React, { useState, useEffect } from 'react';
import { api } from './services/api';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('list'); // 'list' or 'graph'
  
  useEffect(() => {
    fetchTasks();
  }, []);
  
  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTasks();
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateTask = async (taskData) => {
    try {
      await api.createTask(taskData);
      await fetchTasks();
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleUpdateTask = async (id, data) => {
    try {
      await api.updateTask(id, data);
      await fetchTasks();
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleDeleteTask = async (id) => {
    try {
      await api.deleteTask(id);
      await fetchTasks();
    } catch (err) {
      if (err.dependent_tasks) {
        setError(`Cannot delete: ${err.dependent_tasks.length} tasks depend on this`);
      } else {
        setError(err.message || 'Failed to delete task');
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Task Dependency Tracker
        </h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold">×</button>
          </div>
        )}
        
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setActiveView('list')}
            className={`px-4 py-2 rounded ${
              activeView === 'list'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border'
            }`}
          >
            Task List
          </button>
          <button
            onClick={() => setActiveView('graph')}
            className={`px-4 py-2 rounded ${
              activeView === 'graph'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border'
            }`}
          >
            Dependency Graph
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : activeView === 'list' ? (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500">Task list view - coming in Step 10</p>
            <p className="text-sm text-gray-400 mt-2">Tasks loaded: {tasks.length}</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500">Dependency graph view - coming in Step 13</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
