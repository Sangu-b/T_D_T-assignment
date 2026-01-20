export function calculateHierarchicalLayout(nodes, edges) {
  /*
   * nodes: [{id, title, status}, ...]
   * edges: [{from, to}, ...] (from depends on to)
   *
   * Returns: [{id, x, y, title, status}, ...]
   */
  
  // Step 1: Build adjacency map
  const dependsOn = new Map();
  const dependedBy = new Map();
  
  nodes.forEach(node => {
    dependsOn.set(node.id, []);
    dependedBy.set(node.id, []);
  });
  
  edges.forEach(edge => {
    dependsOn.get(edge.from).push(edge.to);
    dependedBy.get(edge.to).push(edge.from);
  });
  
  // Step 2: Calculate level for each node using BFS
  const levels = new Map();
  const queue = [];
  
  // Find root nodes (no dependencies)
  nodes.forEach(node => {
    if (dependsOn.get(node.id).length === 0) {
      levels.set(node.id, 0);
      queue.push(node.id);
    }
  });
  
  // BFS to assign levels
  while (queue.length > 0) {
    const currentId = queue.shift();
    const currentLevel = levels.get(currentId);
    
    const dependents = dependedBy.get(currentId) || [];
    
    dependents.forEach(depId => {
      const deps = dependsOn.get(depId);
      const maxDepLevel = Math.max(
        ...deps.map(d => levels.get(d) || -1)
      );
      const newLevel = maxDepLevel + 1;
      
      if (!levels.has(depId) || levels.get(depId) < newLevel) {
        levels.set(depId, newLevel);
        queue.push(depId);
      }
    });
  }
  
  // Step 3: Group nodes by level
  const nodesByLevel = new Map();
  nodes.forEach(node => {
    const level = levels.get(node.id) || 0;
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level).push(node);
  });
  
  // Step 4: Calculate x, y positions
  const LEVEL_HEIGHT = 120;
  const NODE_SPACING = 150;
  const NODE_RADIUS = 30;
  
  const positionedNodes = [];
  
  nodesByLevel.forEach((nodesInLevel, level) => {
    const y = level * LEVEL_HEIGHT + 50;
    const totalWidth = nodesInLevel.length * NODE_SPACING;
    const startX = (800 - totalWidth) / 2;
    
    nodesInLevel.forEach((node, index) => {
      const x = startX + index * NODE_SPACING + NODE_SPACING / 2;
      
      positionedNodes.push({
        id: node.id,
        x: x,
        y: y,
        title: node.title,
        status: node.status,
        radius: NODE_RADIUS
      });
    });
  });
  
  return positionedNodes;
}
