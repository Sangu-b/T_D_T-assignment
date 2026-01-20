import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import GraphCanvas from './GraphCanvas';
import { calculateHierarchicalLayout } from './layoutEngine';
import { STATUS_COLORS, STATUS_LABELS } from '../utils/constants';

function DependencyGraph({ tasks, onRefresh }) {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGraphData();
  }, [tasks]);

  const fetchGraphData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getGraph();
      setGraphData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate positioned nodes using the layout engine
  const positionedNodes = calculateHierarchicalLayout(
    graphData.nodes || [],
    graphData.edges || []
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8 text-gray-500">
          Loading graph...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8 text-red-500">
          Error: {error}
        </div>
      </div>
    );
  }

  if (graphData.nodes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No tasks to display.</p>
          <p className="text-sm text-gray-400">Create some tasks to see the dependency graph.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Dependency Graph
        </h2>
        <button
          onClick={fetchGraphData}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          Refresh
        </button>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4">
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <div key={status} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[status] }}
            />
            <span className="text-sm text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      <div className="text-sm text-gray-500 mb-4">
        <p>• Click on a node to highlight its connections</p>
        <p>• Arrows point from dependent task to its dependency</p>
        <p>• Tasks with no dependencies appear at the top</p>
      </div>

      {/* Canvas */}
      <GraphCanvas
        nodes={positionedNodes}
        edges={graphData.edges || []}
      />

      {/* Stats */}
      <div className="mt-4 text-sm text-gray-500">
        Total Tasks: {graphData.nodes.length} | 
        Total Dependencies: {graphData.edges.length}
      </div>
    </div>
  );
}

export default DependencyGraph;
