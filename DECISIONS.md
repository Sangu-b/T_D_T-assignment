# Technical Decisions

This document explains the key technical decisions made during the implementation of the Task Dependency Tracker.

## 1. Circular Dependency Detection

### Choice: Depth-First Search (DFS) with Backtracking

**Why DFS?**
- **Natural fit:** Graph traversal is inherently recursive
- **Memory efficient:** Only stores current path in stack
- **Path tracking:** Easy to construct the exact cycle path for error messages

**Algorithm:**
```
1. Start from proposed dependency (Task B)
2. Traverse all of B's dependencies recursively
3. If we encounter the original task (A), cycle detected
4. Backtrack and continue exploring other paths
```

**Complexity:**
- Time: O(V + E) where V = tasks, E = dependencies
- Space: O(V) for recursion stack and visited set

**Alternative Considered:** BFS
- Requires explicit queue and path tracking for each node
- More complex to reconstruct exact cycle path
- No performance advantage for our use case

## 2. Auto-Status Update Mechanism

### Choice: Django Post-Save Signals

**Why signals?**
- **Automatic:** Status updates happen regardless of how task is modified
- **Centralized:** All update logic in one place (signals.py)
- **Decoupled:** Views don't need to know about status cascade logic

**Triggers:**
1. Task status changes to "completed" → Update all dependent tasks
2. Task status changes to "blocked" → Propagate blockage
3. Dependency added → Re-evaluate task status
4. Dependency removed → Re-evaluate task status

**Alternative Considered:** Manual updates in views
- Easy to forget in some endpoints
- Violates DRY principle
- Harder to maintain

## 3. Graph Visualization

### Choice: HTML5 Canvas + Hierarchical Layout

**Why Canvas over SVG?**
- **Performance:** Better for frequent redraws with zoom
- **Simplicity:** Direct pixel manipulation
- **Control:** Full control over rendering pipeline

**Why Hierarchical over Force-Directed?**
- **Predictability:** Nodes always in same position
- **Simplicity:** O(V) calculation vs iterative simulation
- **Readability:** Clear top-down dependency flow
- **No external libraries:** Assignment requirement

**Layout Algorithm:**
1. Build adjacency maps (dependsOn, dependedBy)
2. Find root nodes (no dependencies) → Level 0
3. BFS to assign levels to remaining nodes
4. Group nodes by level
5. Calculate x, y positions with even spacing

## 4. State Management

### Choice: React useState/useEffect + Props

**Why no Redux/Zustand?**
- **Requirement:** Assignment explicitly forbids them
- **Simplicity:** Only 4-5 components need shared state
- **Sufficient:** Props drilling is manageable at this scale

**State Structure:**
- `tasks[]` - All tasks with their dependencies
- `loading` - API loading state
- `error` - Error message
- `activeView` - Current view (list/graph)

## 5. Database Design

### Choice: Separate TaskDependency Table

**Why not a JSON field?**
- **Queryability:** Can query dependencies efficiently
- **Integrity:** Foreign key constraints ensure valid references
- **Indexing:** Can index for performance
- **Normalization:** Proper relational design

**Indexes:**
- `task_id` - For finding task's dependencies
- `depends_on_id` - For finding reverse dependencies (who depends on this)

## Trade-offs Made

| Decision | Trade-off | Impact |
|----------|-----------|--------|
| Hierarchical layout | Less visually impressive than force-directed | More functional, predictable, easier to implement |
| Canvas vs SVG | Less accessibility (no DOM elements) | Better performance for dynamic rendering |
| Signals vs Manual | Slight overhead per save | Guaranteed consistency, easier maintenance |
| DFS with path tracking | More memory for path | Better error messages for users |
| SQLite for dev | Not production-ready | Faster development iteration |

## What Would I Improve Given More Time?

### Backend Improvements
1. **Caching:** Cache dependency graph structure in Redis
2. **Batch updates:** Use `bulk_update()` for status cascade
3. **Async processing:** Use Celery for complex dependency chains
4. **Transaction safety:** Wrap operations in database transactions
5. **API versioning:** Add `/api/v1/` prefix for future compatibility

### Frontend Improvements
1. **Virtual scrolling:** For handling 100+ tasks efficiently
2. **WebSocket:** Real-time updates when tasks change
3. **Graph panning:** Drag canvas to navigate large graphs
4. **Minimap:** Overview panel for large dependency graphs
5. **Keyboard shortcuts:** Arrow keys for navigation
6. **Undo/Redo:** Action history stack

### Graph Visualization Improvements
1. **Force-directed layout:** As an alternative view option
2. **Curved edges:** Bezier curves to avoid node overlapping
3. **Collapse/expand:** Hide sub-graphs for complex dependencies
4. **Export to PNG:** Save graph as image
5. **Zoom to fit:** Auto-adjust zoom to show all nodes

## Conclusion

The implementation prioritizes:
- **Correctness:** Algorithms work as specified
- **Maintainability:** Clean separation of concerns
- **Simplicity:** No over-engineering
- **Compliance:** Follows all assignment constraints

The focus is on delivering a functional, well-structured solution that demonstrates understanding of the core concepts rather than adding unnecessary complexity.
