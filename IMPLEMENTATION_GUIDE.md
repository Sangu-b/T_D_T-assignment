# Task Dependency Tracker - Complete Implementation Guide

**Target:** GitHub Copilot (Claude model) + Human Developers  
**Assignment:** Build a Task Dependency Management System with React + Django  
**Key Constraints:** No Redux/Zustand, No D3/Cytoscape, Minimal fields only

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Implementation Phases](#3-implementation-phases)
4. [Database Schema](#4-database-schema)
5. [Backend Implementation](#5-backend-implementation)
6. [Frontend Implementation](#6-frontend-implementation)
7. [REST API Contract](#7-rest-api-contract)
8. [Core Algorithms](#8-core-algorithms)
9. [Data Flow Diagrams](#9-data-flow-diagrams)
10. [Common Mistakes to Avoid](#10-common-mistakes-to-avoid)
11. [Technical Decisions (DECISIONS.md)](#11-technical-decisions-decisionsmd)
12. [Testing Strategy](#12-testing-strategy)
13. [Performance Considerations](#13-performance-considerations)

---

## 1. Project Overview

### Problem Statement
Build a Task Dependency Management System where tasks can have dependencies on other tasks. The system should automatically detect circular dependencies, update task statuses based on dependency completion, and visualize the dependency relationships.

### Core Requirements
1. Tasks can have multiple dependencies (one task depends on others)
2. Detect and prevent circular dependencies (A → B → C → A)
3. Auto-update task status when all dependencies are complete
4. Visualize task dependencies as an interactive graph
5. Handle real-time updates and edge cases

### Technical Stack
- **Frontend:** React 18+ with hooks, Tailwind CSS, Canvas/SVG for graphs
- **Backend:** Django 4.x with DRF, MySQL 8.0+
- **State Management:** React useState/useEffect (no Redux/Zustand)
- **Graph Visualization:** Custom HTML5 Canvas (no D3/Cytoscape)

---

## 2. System Architecture

```
┌─────────────────┐
│   React SPA     │
│  (Port 3000)    │
│                 │
│  - Task List    │
│  - Forms        │
│  - Graph Canvas │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────┐
│  Django + DRF   │
│  (Port 8000)    │
│                 │
│  - API Layer    │
│  - Business     │
│    Logic        │
│  - Validators   │
└────────┬────────┘
         │
         │ ORM
         │
┌────────▼────────┐
│   MySQL 8.0+    │
│                 │
│  - tasks        │
│  - task_deps    │
└─────────────────┘
```

### Key Design Principles
- **Backend:** Use Django signals for auto-status updates
- **Frontend:** Single state object in App component, passed via props
- **Graph:** Hierarchical layout (top-to-bottom), HTML5 Canvas rendering
- **API:** RESTful design with proper error codes

---

## 3. Implementation Phases

### Phase 1: Backend Foundation
- Set up Django project with DRF
- Create database models (Task, TaskDependency)
- Implement circular dependency detection algorithm
- Build core API endpoints
- Write unit tests for circular dependency logic

### Phase 2: Backend Auto-Status Logic
- Implement auto-status update mechanism
- Add signal handlers or post-save logic
- Test status propagation scenarios
- Handle edge cases (cascading updates)

### Phase 3: Frontend Task Management
- Set up React project with Tailwind
- Build task list view with status color coding
- Create forms (add task, add dependency, update status)
- Implement API integration layer
- Add form validation and error handling

### Phase 4: Graph Visualization
- Build Canvas/SVG graph renderer
- Implement node positioning algorithm (hierarchical layout)
- Draw edges with directional arrows
- Add node color coding by status
- Implement click interactions and highlighting

### Phase 5: Polish & Edge Cases
- Handle delete warnings
- Add loading states and error messages
- Test with 20-30 tasks
- Empty state handling
- Final testing and bug fixes

---

## 4. Database Schema

### Task Table
| Column      | Type         | Constraints                          |
|-------------|--------------|--------------------------------------|
| id          | INT          | PRIMARY KEY, AUTO_INCREMENT          |
| title       | VARCHAR(200) | NOT NULL                             |
| description | TEXT         | NULL                                 |
| status      | VARCHAR(20)  | NOT NULL, DEFAULT 'pending'          |
| created_at  | DATETIME     | AUTO_NOW_ADD                         |
| updated_at  | DATETIME     | AUTO_NOW                             |

**Status Enum:** `pending`, `in_progress`, `completed`, `blocked`

### TaskDependency Table
| Column        | Type     | Constraints                                    |
|---------------|----------|------------------------------------------------|
| id            | INT      | PRIMARY KEY, AUTO_INCREMENT                    |
| task_id       | INT      | FOREIGN KEY → Task(id), ON_DELETE CASCADE     |
| depends_on_id | INT      | FOREIGN KEY → Task(id), ON_DELETE CASCADE     |
| created_at    | DATETIME | AUTO_NOW_ADD                                   |

**Unique Constraint:** (task_id, depends_on_id)

**Indexes:**
- Index on `task_id` for quick lookup
- Index on `depends_on_id` for reverse lookup

---

## 5. Backend Implementation

### Folder Structure
```
task_dependency_backend/
├── manage.py
├── requirements.txt
├── README.md
├── DECISIONS.md
├── config/                # Django project settings
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── tasks/                 # Main app
│   ├── __init__.py
│   ├── models.py          # Task, TaskDependency models
│   ├── serializers.py     # DRF serializers
│   ├── views.py           # API viewsets
│   ├── urls.py            # App-level URLs
│   ├── services/
│   │   ├── __init__.py
│   │   ├── dependency_checker.py  # Circular dependency DFS
│   │   └── status_updater.py      # Auto-status logic
│   ├── signals.py         # Post-save signal handlers
│   ├── apps.py
│   └── tests/
│       ├── __init__.py
│       ├── test_models.py
│       ├── test_circular_deps.py
│       └── test_status_updates.py
└── db.sqlite3             # For development
```

### Models (tasks/models.py)

```python
from django.db import models

class Task(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('blocked', 'Blocked'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title

class TaskDependency(models.Model):
    task = models.ForeignKey(
        Task, 
        on_delete=models.CASCADE, 
        related_name='dependencies'
    )
    depends_on = models.ForeignKey(
        Task, 
        on_delete=models.CASCADE, 
        related_name='dependent_tasks'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('task', 'depends_on')
        indexes = [
            models.Index(fields=['task']),
            models.Index(fields=['depends_on']),
        ]
    
    def __str__(self):
        return f"{self.task.title} depends on {self.depends_on.title}"
```

### Serializers (tasks/serializers.py)

```python
from rest_framework import serializers
from .models import Task, TaskDependency

class TaskDependencySerializer(serializers.ModelSerializer):
    depends_on_title = serializers.CharField(source='depends_on.title', read_only=True)
    depends_on_status = serializers.CharField(source='depends_on.status', read_only=True)
    
    class Meta:
        model = TaskDependency
        fields = ['id', 'depends_on', 'depends_on_title', 'depends_on_status', 'created_at']

class TaskSerializer(serializers.ModelSerializer):
    dependencies = TaskDependencySerializer(many=True, read_only=True)
    dependent_tasks = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status', 
            'created_at', 'updated_at', 'dependencies', 'dependent_tasks'
        ]
    
    def get_dependent_tasks(self, obj):
        return list(obj.dependent_tasks.values_list('task_id', flat=True))

class GraphSerializer(serializers.Serializer):
    nodes = serializers.SerializerMethodField()
    edges = serializers.SerializerMethodField()
    
    def get_nodes(self, obj):
        tasks = obj.get('tasks', [])
        return [
            {
                'id': task.id,
                'title': task.title,
                'status': task.status
            }
            for task in tasks
        ]
    
    def get_edges(self, obj):
        dependencies = obj.get('dependencies', [])
        return [
            {
                'from': dep.task_id,
                'to': dep.depends_on_id
            }
            for dep in dependencies
        ]
```

### Circular Dependency Checker (tasks/services/dependency_checker.py)

```python
from tasks.models import Task, TaskDependency

class DependencyChecker:
    @staticmethod
    def check_circular_dependency(task_id, depends_on_id):
        """
        Detect circular dependencies using DFS.
        Returns: (is_circular: bool, cycle_path: list)
        """
        # Edge case: Task cannot depend on itself
        if task_id == depends_on_id:
            return (True, [task_id, task_id])
        
        visited = set()
        path = []
        
        def dfs(current_id):
            # Found cycle - we've reached the original task
            if current_id == task_id:
                path.append(current_id)
                return True
            
            # Already explored this path
            if current_id in visited:
                return False
            
            visited.add(current_id)
            path.append(current_id)
            
            # Get all dependencies of current task
            dependencies = TaskDependency.objects.filter(
                task_id=current_id
            ).values_list('depends_on_id', flat=True)
            
            # Recursively check each dependency
            for dep_id in dependencies:
                if dfs(dep_id):
                    return True
            
            # Backtrack
            path.pop()
            visited.remove(current_id)
            return False
        
        # Start DFS from the proposed dependency
        has_cycle = dfs(depends_on_id)
        return (has_cycle, path if has_cycle else [])
```

### Status Updater (tasks/services/status_updater.py)

```python
from tasks.models import Task, TaskDependency

class StatusUpdater:
    @staticmethod
    def update_task_status(task):
        """Update a single task's status based on its dependencies."""
        # Get all tasks this task depends on
        dependencies = TaskDependency.objects.filter(
            task=task
        ).select_related('depends_on')
        
        # No dependencies = user-controlled status
        if not dependencies.exists():
            return
        
        dependency_statuses = [dep.depends_on.status for dep in dependencies]
        
        # Any blocked dependency → task is blocked
        if 'blocked' in dependency_statuses:
            if task.status != 'blocked':
                task.status = 'blocked'
                task.save(update_fields=['status', 'updated_at'])
            return
        
        # All completed → task is ready (in_progress)
        if all(s == 'completed' for s in dependency_statuses):
            # Don't override if already completed or in_progress
            if task.status not in ['completed', 'in_progress']:
                task.status = 'in_progress'
                task.save(update_fields=['status', 'updated_at'])
            return
        
        # Mixed states → pending
        if task.status not in ['completed', 'in_progress']:
            task.status = 'pending'
            task.save(update_fields=['status', 'updated_at'])
    
    @staticmethod
    def update_dependent_tasks(task, depth=0):
        """Update all tasks that depend on this task."""
        # Prevent infinite recursion
        if depth > 50:
            return
        
        # Find all tasks that have this task as a dependency
        dependent_task_ids = TaskDependency.objects.filter(
            depends_on=task
        ).values_list('task_id', flat=True)
        
        # Update each dependent task
        for task_id in dependent_task_ids:
            dependent_task = Task.objects.get(id=task_id)
            StatusUpdater.update_task_status(dependent_task)
            # Recursively update tasks that depend on the dependent task
            StatusUpdater.update_dependent_tasks(dependent_task, depth + 1)
```

### Signals (tasks/signals.py)

```python
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from tasks.models import Task, TaskDependency
from tasks.services.status_updater import StatusUpdater

@receiver(post_save, sender=Task)
def task_status_changed(sender, instance, created, **kwargs):
    """When a task's status changes, update dependent tasks."""
    if created:
        # New task created - no need to update dependents
        return
    
    # If status changed to 'completed' or 'blocked', update dependent tasks
    if instance.status in ['completed', 'blocked']:
        StatusUpdater.update_dependent_tasks(instance)

@receiver(post_save, sender=TaskDependency)
def dependency_added(sender, instance, created, **kwargs):
    """When a dependency is added, update the task's status."""
    if created:
        StatusUpdater.update_task_status(instance.task)

@receiver(post_delete, sender=TaskDependency)
def dependency_removed(sender, instance, **kwargs):
    """When a dependency is removed, update the task's status."""
    StatusUpdater.update_task_status(instance.task)
```

### Apps Configuration (tasks/apps.py)

```python
from django.apps import AppConfig

class TasksConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'tasks'
    
    def ready(self):
        import tasks.signals  # Register signals
```

### Views (tasks/views.py)

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Task, TaskDependency
from .serializers import TaskSerializer, TaskDependencySerializer, GraphSerializer
from .services.dependency_checker import DependencyChecker
from .services.status_updater import StatusUpdater

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    
    @action(detail=True, methods=['post'], url_path='dependencies')
    def add_dependency(self, request, pk=None):
        """
        POST /api/tasks/{id}/dependencies/
        Body: {"depends_on_id": 5}
        """
        task = self.get_object()
        depends_on_id = request.data.get('depends_on_id')
        
        if not depends_on_id:
            return Response(
                {"error": "depends_on_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if dependency exists
        try:
            depends_on_task = Task.objects.get(id=depends_on_id)
        except Task.DoesNotExist:
            return Response(
                {"error": "Dependency task not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check for circular dependency
        is_circular, cycle_path = DependencyChecker.check_circular_dependency(
            task.id,
            depends_on_id
        )
        
        if is_circular:
            return Response(
                {
                    "error": "Circular dependency detected",
                    "path": cycle_path
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the dependency
        dependency, created = TaskDependency.objects.get_or_create(
            task=task,
            depends_on=depends_on_task
        )
        
        if not created:
            return Response(
                {"error": "Dependency already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update task status based on new dependency
        StatusUpdater.update_task_status(task)
        
        serializer = TaskDependencySerializer(dependency)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['delete'], url_path='dependencies/(?P<dep_id>[^/.]+)')
    def remove_dependency(self, request, pk=None, dep_id=None):
        """
        DELETE /api/tasks/{id}/dependencies/{dep_id}/
        """
        task = self.get_object()
        
        try:
            dependency = TaskDependency.objects.get(
                task=task,
                depends_on_id=dep_id
            )
            dependency.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except TaskDependency.DoesNotExist:
            return Response(
                {"error": "Dependency not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def destroy(self, request, *args, **kwargs):
        """
        DELETE /api/tasks/{id}/
        Check for dependent tasks before deletion
        """
        task = self.get_object()
        
        # Check if other tasks depend on this
        dependent_tasks = TaskDependency.objects.filter(
            depends_on=task
        ).select_related('task')
        
        if dependent_tasks.exists():
            return Response(
                {
                    "error": "Cannot delete task with dependencies",
                    "dependent_tasks": [
                        {"id": dep.task.id, "title": dep.task.title}
                        for dep in dependent_tasks
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().destroy(request, *args, **kwargs)

class DependencyGraphView(viewsets.ViewSet):
    @action(detail=False, methods=['get'])
    def graph(self, request):
        """
        GET /api/dependencies/graph/
        """
        tasks = Task.objects.all()
        dependencies = TaskDependency.objects.all()
        
        serializer = GraphSerializer({
            'tasks': tasks,
            'dependencies': dependencies
        })
        
        return Response(serializer.data)
```

---

## 6. Frontend Implementation

### Folder Structure
```
task_dependency_frontend/
├── package.json
├── README.md
├── tailwind.config.js
├── public/
│   └── index.html
└── src/
    ├── index.js
    ├── App.js                    # Main component, holds state
    ├── services/
    │   └── api.js                # Centralized API calls
    ├── components/
    │   ├── TaskList.js           # Display all tasks
    │   ├── TaskItem.js           # Individual task row
    │   ├── AddTaskForm.js        # Create new task
    │   ├── AddDependencyForm.js  # Add dependency to task
    │   ├── StatusBadge.js        # Color-coded status indicator
    │   ├── DeleteConfirmModal.js
    │   └── ErrorMessage.js
    ├── graph/
    │   ├── DependencyGraph.js    # Main graph component
    │   ├── GraphCanvas.js        # Canvas rendering logic
    │   └── layoutEngine.js       # Node positioning algorithm
    └── utils/
        ├── constants.js          # Status colors, API endpoints
        └── validators.js         # Client-side validation
```

### API Service (src/services/api.js)

```javascript
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
```

### Main App Component (src/App.js)

```javascript
import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import TaskList from './components/TaskList';
import AddTaskForm from './components/AddTaskForm';
import DependencyGraph from './graph/DependencyGraph';
import ErrorMessage from './components/ErrorMessage';

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
        
        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
        
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
        
        {activeView === 'list' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TaskList
                tasks={tasks}
                loading={loading}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onRefresh={fetchTasks}
              />
            </div>
            <div>
              <AddTaskForm onSubmit={handleCreateTask} />
            </div>
          </div>
        ) : (
          <DependencyGraph tasks={tasks} onRefresh={fetchTasks} />
        )}
      </div>
    </div>
  );
}

export default App;
```

### Graph Layout Engine (src/graph/layoutEngine.js)

```javascript
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
```

### Graph Canvas Component (src/graph/GraphCanvas.js)

```javascript
import React, { useRef, useEffect, useState } from 'react';

const STATUS_COLORS = {
  pending: '#9CA3AF',      // gray
  in_progress: '#3B82F6',  // blue
  completed: '#10B981',    // green
  blocked: '#EF4444'       // red
};

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
    drawNodes(ctx, nodes, selectedNodeId);
    
    ctx.restore();
  }, [nodes, edges, scale, selectedNodeId]);
  
  function drawNodes(ctx, nodes, selectedId) {
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
  
  function handleCanvasClick(event) {
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
  }
  
  function handleZoomIn() {
    setScale(prev => Math.min(prev + 0.2, 3));
  }
  
  function handleZoomOut() {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  }
  
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
```

---

## 7. REST API Contract

### Base URL
`http://localhost:8000/api/`

### Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tasks/` | GET | List all tasks |
| `/api/tasks/` | POST | Create new task |
| `/api/tasks/{id}/` | GET | Get task detail |
| `/api/tasks/{id}/` | PATCH | Update task |
| `/api/tasks/{id}/` | DELETE | Delete task |
| `/api/tasks/{id}/dependencies/` | POST | Add dependency |
| `/api/tasks/{id}/dependencies/{dep_id}/` | DELETE | Remove dependency |
| `/api/dependencies/graph/` | GET | Get full graph |

### Detailed Schemas

**1. GET /api/tasks/**
```json
[
  {
    "id": 1,
    "title": "Design database schema",
    "description": "Create ER diagram",
    "status": "completed",
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-01-16T14:20:00Z",
    "dependencies": [
      {
        "id": 2,
        "depends_on": 5,
        "depends_on_title": "Setup Django",
        "depends_on_status": "completed"
      }
    ],
    "dependent_tasks": [3, 5]
  }
]
```

**2. POST /api/tasks/{id}/dependencies/**

Request:
```json
{
  "depends_on_id": 5
}
```

Success (201):
```json
{
  "id": 23,
  "depends_on": 5,
  "depends_on_title": "Setup project",
  "depends_on_status": "completed",
  "created_at": "2026-01-20T10:15:00Z"
}
```

Error - Circular Dependency (400):
```json
{
  "error": "Circular dependency detected",
  "path": [3, 7, 5, 3]
}
```

---

## 8. Core Algorithms

### 8.1 Circular Dependency Detection (DFS)

**Concept:**
- Start from the proposed dependency (Task B)
- Traverse all of B's dependencies recursively
- If we encounter the original task (A), we have a cycle

**Pseudocode:**
```python
def has_circular_dependency(task_id, new_dependency_id):
    # Edge case
    if task_id == new_dependency_id:
        return (True, [task_id, task_id])
    
    visited = set()
    path = []
    
    def dfs(current_task_id):
        # Found cycle
        if current_task_id == task_id:
            path.append(current_task_id)
            return True
        
        # Already visited
        if current_task_id in visited:
            return False
        
        visited.add(current_task_id)
        path.append(current_task_id)
        
        # Get dependencies
        dependencies = get_dependencies(current_task_id)
        
        for dep in dependencies:
            if dfs(dep.depends_on_id):
                return True
        
        # Backtrack
        path.pop()
        visited.remove(current_task_id)
        return False
    
    # Run DFS
    if dfs(new_dependency_id):
        return (True, path)
    else:
        return (False, [])
```

**Complexity:**
- **Time:** O(V + E) - V=tasks, E=dependencies
- **Space:** O(V) - recursion stack + visited set

### 8.2 Auto-Status Update Rules

| Dependency State | New Task Status |
|------------------|-----------------|
| All completed | `in_progress` (ready to work) |
| Any blocked | `blocked` (cannot proceed) |
| Mixed (some pending/in_progress) | `pending` (waiting) |
| No dependencies | User-controlled |

**Update Triggers:**
1. Task status changes to "completed" → Update all dependent tasks
2. Task status changes to "blocked" → Propagate blockage
3. Dependency added → Re-evaluate task status
4. Dependency removed → Re-evaluate task status

---

## 9. Data Flow Diagrams

### Task Creation Flow
```
User fills form → AddTaskForm
  ↓
api.createTask(data)
  ↓
POST /api/tasks/
  ↓
Django creates Task instance
  ↓
Returns task object
  ↓
App state updated (setState)
  ↓
TaskList re-renders
```

### Adding Dependency Flow
```
User selects dependency → AddDependencyForm
  ↓
Validate (not self)
  ↓
POST /api/tasks/{id}/dependencies/
  ↓
Django: Run DFS for circular check
  ↓
┌──────────┴──────────┐
│                     │
Circular?           Valid?
│                     │
Return 400          Create TaskDependency
│                     │
                    Update task status
                      │
                    Return 201
                      │
Update frontend state
  ↓
Re-render TaskList + Graph
```

### Auto-Status Update Flow
```
User marks Task A as "completed"
  ↓
PATCH /api/tasks/A/ {status: "completed"}
  ↓
Django saves Task A
  ↓
Post-save signal triggered
  ↓
Find all tasks that depend on A
  ↓
For each dependent task B:
  - Check if ALL B's dependencies are completed
  - If yes: set B status to "in_progress"
  - If any blocked: set B to "blocked"
  - If pending exist: keep B as "pending"
  ↓
Return updated task A
  ↓
Frontend refetches all tasks
  ↓
Re-render with new statuses
```

---

## 10. Common Mistakes to Avoid

### Backend Mistakes

#### ❌ Mistake 1: Adding Extra Fields
```python
# WRONG
class Task(models.Model):
    title = models.CharField(max_length=200)
    priority = models.IntegerField()  # ❌ NOT REQUIRED
    assigned_to = models.ForeignKey(User)  # ❌ NOT REQUIRED
```

✅ **Correct:** Only include required fields (id, title, description, status, timestamps)

#### ❌ Mistake 2: Not Returning Exact Cycle Path
```python
# WRONG
def check_circular(task_id, depends_on_id):
    if has_cycle:
        return True  # ❌ Assignment requires exact path
```

✅ **Correct:** Return `(True, [1, 3, 5, 1])`

#### ❌ Mistake 3: Forgetting to Update Dependent Tasks
```python
# WRONG
task.status = request.data['status']
task.save()  # ❌ Doesn't update dependent tasks
```

✅ **Correct:** Call `StatusUpdater.update_dependent_tasks(task)`

#### ❌ Mistake 4: Infinite Recursion
```python
# WRONG
def update_dependent_tasks(task):
    for dep in dependents:
        update_dependent_tasks(dep)  # ❌ Can loop forever
```

✅ **Correct:** Add depth limit `def update_dependent_tasks(task, depth=0):`

### Frontend Mistakes

#### ❌ Mistake 5: Using UI Component Libraries
```javascript
// WRONG
import { Button } from 'react-bootstrap';  // ❌ FORBIDDEN
import { Button } from '@mui/material';    // ❌ FORBIDDEN
```

✅ **Correct:** Use Tailwind utility classes only

#### ❌ Mistake 6: Using Graph Libraries
```javascript
// WRONG
import * as d3 from 'd3';                    // ❌ FORBIDDEN
import cytoscape from 'cytoscape';           // ❌ FORBIDDEN
import ReactFlow from 'react-flow-renderer'; // ❌ FORBIDDEN
```

✅ **Correct:** Use HTML5 Canvas or SVG

#### ❌ Mistake 7: Not Handling Loading States
```javascript
// WRONG
function TaskList() {
  const [tasks, setTasks] = useState([]);
  
  useEffect(() => {
    fetch('/api/tasks/')
      .then(res => res.json())
      .then(setTasks);
  }, []);
  
  return tasks.map(task => <TaskItem task={task} />);  // ❌ No loading indicator
}
```

✅ **Correct:** Add loading/error states

#### ❌ Mistake 8: Not Validating Before API Call
```javascript
// WRONG
async function addDependency(taskId, dependsOnId) {
  // ❌ What if task depends on itself?
  await fetch(`/api/tasks/${taskId}/dependencies/`, {
    method: 'POST',
    body: JSON.stringify({ depends_on_id: dependsOnId })
  });
}
```

✅ **Correct:** Validate `taskId !== dependsOnId` first

### Graph Visualization Mistakes

#### ❌ Mistake 9: Not Handling Empty Graph
```javascript
// WRONG
function DependencyGraph({ tasks }) {
  const nodes = tasks.map(t => ({ id: t.id, ... }));  // ❌ Crashes if empty
  return <canvas>...</canvas>;
}
```

✅ **Correct:** Check for empty array first

#### ❌ Mistake 10: Not Color-Coding by Status
```javascript
// WRONG
ctx.fillStyle = '#3B82F6';  // ❌ Same color for all
ctx.fill();
```

✅ **Correct:** Use `STATUS_COLORS[node.status]`

---

## 11. Technical Decisions (DECISIONS.md)

### 1. Circular Dependency Detection Algorithm

**Choice:** Depth-First Search (DFS)

**Why DFS over BFS?**
- **Path tracking:** DFS naturally maintains the recursion stack, making it trivial to return the exact cycle path
- **Code simplicity:** Recursive implementation is cleaner than BFS queue management
- **Memory efficiency:** For typical task graphs (20-30 nodes), DFS recursion depth is manageable
- **Same complexity:** Both have O(V + E) time complexity

**Alternative Considered:** BFS
- Requires explicit queue and path tracking for each node
- More complex to reconstruct exact cycle path
- No performance advantage

### 2. Auto-Status Update Mechanism

**Choice:** Django Post-Save Signals

**Why signals?**
- **Automatic:** Status updates happen regardless of how task is modified
- **Centralized:** All update logic in one place
- **Decoupled:** Views don't need to know about status cascade logic

**Alternative Considered:** Manual updates in views
- Easy to forget in some endpoints
- Violates DRY principle
- Harder to maintain

### 3. Graph Visualization

**Choice:** HTML5 Canvas + Hierarchical Layout

**Why Canvas over SVG?**
- **Performance:** Better for frequent redraws
- **Simplicity:** Direct pixel manipulation
- **Control:** Full control over rendering

**Why Hierarchical over Force-Directed?**
- **Predictability:** Nodes always in same position
- **Simplicity:** O(V) calculation vs iterative simulation
- **Readability:** Clear top-down dependency flow

**Alternative Considered:** Force-directed layout
- Requires physics simulation
- Nodes move around (harder to track)
- Overkill for dependency trees

### 4. State Management

**Choice:** React Context + useState

**Why no Redux/Zustand?**
- **Requirement:** Assignment explicitly forbids them
- **Simplicity:** Only 4-5 components need shared state
- **Sufficient:** Props drilling is manageable

### Trade-offs Made

| Decision | Trade-off | Impact |
|----------|-----------|--------|
| Hierarchical layout | Less visually impressive | More functional, easier to implement |
| Canvas vs SVG | Less accessibility | Better performance |
| Signals vs Manual | Slight overhead | Easier maintenance |
| DFS with path | More memory | Better error messages |

---

## 12. Testing Strategy

### Backend Tests

```python
# Test circular dependency
def test_simple_cycle():
    # A→B→C→A
    
def test_self_dependency():
    # A→A
    
def test_long_cycle():
    # A→B→C→D→E→A
    
def test_no_cycle():
    # Valid DAG

# Test status updates
def test_all_completed():
    # → in_progress
    
def test_one_blocked():
    # → blocked
    
def test_mixed_pending():
    # → pending
```

### Frontend Tests
- Component rendering
- Form validation
- API error handling
- Graph node clicking

---

## 13. Performance Considerations

### Backend
- Index foreign keys for fast dependency lookups
- Limit DFS depth (prevent infinite loops)
- Use `select_related`/`prefetch_related` for queries

### Frontend
- Debounce status updates
- Memoize graph layout calculations
- Use `requestAnimationFrame` for canvas rendering
- Proper `React.memo` usage

### Graph
- For 20-30 tasks: Simple canvas is sufficient
- Beyond 50 tasks: Consider viewport culling
- Use Web Workers for heavy calculations (bonus)

---

## Summary Checklist

### Backend ✅
- [ ] Only required fields in models
- [ ] DFS returns exact cycle path
- [ ] Status auto-update via signals
- [ ] Proper HTTP status codes
- [ ] Delete endpoint checks dependents

### Frontend ✅
- [ ] No UI libraries (only Tailwind)
- [ ] Loading states for all API calls
- [ ] Error messages displayed
- [ ] Empty state handling
- [ ] Form validation before API calls

### Graph ✅
- [ ] No graph libraries (Canvas/SVG only)
- [ ] Color-coded nodes by status
- [ ] Hierarchical layout algorithm
- [ ] Click-to-highlight functionality
- [ ] Zoom in/out buttons

### Documentation ✅
- [ ] README with setup instructions
- [ ] DECISIONS.md with algorithm explanations
- [ ] Clean commit history
- [ ] Comments on complex logic

---

## What Would I Improve Given More Time?

### Backend
1. **Caching:** Cache dependency graph structure
2. **Batch updates:** Use `bulk_update()` for status cascade
3. **Async processing:** Use Celery for complex chains
4. **Transaction safety:** Wrap operations in DB transactions
5. **API versioning:** Add `/api/v1/` prefix

### Frontend
1. **Virtual scrolling:** For 100+ tasks
2. **WebSocket:** Real-time updates
3. **Graph panning:** Drag canvas to navigate
4. **Minimap:** Overview for large graphs
5. **Keyboard shortcuts:** Arrow keys navigation
6. **Undo/Redo:** Action history stack

### Graph Visualization
1. **Force-directed layout:** Alternative option
2. **Layered edges:** Bezier curves
3. **Collapse/expand:** Hide sub-graphs
4. **Export to PNG:** Canvas.toDataURL()
5. **Zoom to fit:** Auto-adjust zoom

---

## Conclusion

This implementation demonstrates:
- **Algorithm design:** DFS for cycle detection with O(V+E) complexity
- **System architecture:** Clean separation of concerns
- **UI/UX:** Functional graph visualization without external libraries
- **Best practices:** Signal-based updates, RESTful API, minimal schema

The focus is on **correctness** and **maintainability** over fancy features, exactly as required by the assignment.