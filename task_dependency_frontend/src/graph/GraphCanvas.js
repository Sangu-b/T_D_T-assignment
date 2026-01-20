import React, { useRef, useEffect, useState, useCallback } from 'react';

const STATUS_COLORS = {
  pending: '#9CA3AF',      // gray
  in_progress: '#3B82F6',  // blue
  completed: '#10B981',    // green
  blocked: '#EF4444'       // red
};

// Helper function to check if node should be highlighted
function isNodeHighlighted(nodeId, selectedId, edges) {
  if (!selectedId) return false;
  
  // Highlight if this node is a dependency of selected node
  const isDependency = edges.some(
    e => e.from === selectedId && e.to === nodeId
  );
  
  // Highlight if this node depends on selected node
  const isDependent = edges.some(
    e => e.to === selectedId && e.from === nodeId
  );
  
  return isDependency || isDependent;
}

// Draw arrowhead at edge of target node
function drawArrowhead(ctx, from, to, isHighlighted) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const headLength = 10;
  
  // Position arrow at edge of target node
  const arrowX = to.x - to.radius * Math.cos(angle);
  const arrowY = to.y - to.radius * Math.sin(angle);
  
  ctx.beginPath();
  ctx.moveTo(arrowX, arrowY);
  ctx.lineTo(
    arrowX - headLength * Math.cos(angle - Math.PI / 6),
    arrowY - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(arrowX, arrowY);
  ctx.lineTo(
    arrowX - headLength * Math.cos(angle + Math.PI / 6),
    arrowY - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.strokeStyle = isHighlighted ? '#000000' : '#D1D5DB';
  ctx.stroke();
}

// Draw all nodes on canvas
function drawNodes(ctx, nodes, edges, selectedId) {
  nodes.forEach(node => {
    const isSelected = selectedId === node.id;
    const isHighlighted = isNodeHighlighted(node.id, selectedId, edges);
    
    // Draw circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
    ctx.fillStyle = STATUS_COLORS[node.status];
    ctx.fill();
    
    // Highlight border if selected or connected
    if (isSelected || isHighlighted) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    
    // Draw title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      node.title.substring(0, 10),
      node.x,
      node.y
    );
  });
}

// Draw all edges on canvas
function drawEdges(ctx, nodes, edges, selectedId) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  edges.forEach(edge => {
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);
    
    if (!fromNode || !toNode) return;
    
    const isHighlighted = selectedId === edge.from || selectedId === edge.to;
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(fromNode.x, fromNode.y);
    ctx.lineTo(toNode.x, toNode.y);
    ctx.strokeStyle = isHighlighted ? '#000000' : '#D1D5DB';
    ctx.lineWidth = isHighlighted ? 2 : 1;
    ctx.stroke();
    
    // Draw arrowhead
    drawArrowhead(ctx, fromNode, toNode, isHighlighted);
  });
}

function GraphCanvas({ nodes, edges }) {
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply zoom
    ctx.save();
    ctx.scale(scale, scale);
    
    // Draw edges first (so they appear behind nodes)
    drawEdges(ctx, nodes, edges, selectedNodeId);
    
    // Draw nodes
    drawNodes(ctx, nodes, edges, selectedNodeId);
    
    ctx.restore();
  }, [nodes, edges, scale, selectedNodeId]);
  
  const handleCanvasClick = useCallback((event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;
    
    // Find clicked node
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt(
        Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2)
      );
      return distance <= node.radius;
    });
    
    setSelectedNodeId(clickedNode ? clickedNode.id : null);
  }, [nodes, scale]);
  
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.2, 3));
  }, []);
  
  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  }, []);
  
  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onClick={handleCanvasClick}
        className="border border-gray-300 rounded cursor-pointer bg-white"
      />
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={handleZoomIn}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Zoom In
        </button>
        <button
          onClick={handleZoomOut}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Zoom Out
        </button>
      </div>
    </div>
  );
}

export default GraphCanvas;
