# Task Dependency Tracker

A Task Dependency Management System with React and Django that allows tasks to have dependencies on other tasks, detects circular dependencies, auto-updates task statuses, and visualizes dependency relationships.

## Features

- **Task Management:** Create, update, and delete tasks with title, description, and status
- **Dependency Management:** Add and remove dependencies between tasks
- **Circular Dependency Detection:** Prevents circular dependencies using DFS algorithm
- **Auto-Status Updates:** Automatically updates task status based on dependency states
- **Dependency Graph:** Visual representation of task dependencies using HTML5 Canvas

## Tech Stack

- **Frontend:** React 18+, Tailwind CSS, HTML5 Canvas
- **Backend:** Django 4.x, Django REST Framework
- **Database:** SQLite (development) / MySQL 8.0+ (production)

## Project Structure

```
Inmuto/
├── IMPLEMENTATION_GUIDE.md          # Detailed implementation specification
├── README.md                        # This file
├── DECISIONS.md                     # Technical decisions and trade-offs
├── task_dependency_backend/         # Django backend
│   ├── config/                      # Django project settings
│   ├── tasks/                       # Main application
│   │   ├── models.py                # Task, TaskDependency models
│   │   ├── views.py                 # API viewsets
│   │   ├── serializers.py           # DRF serializers
│   │   ├── signals.py               # Auto-status update signals
│   │   ├── services/                # Business logic
│   │   │   ├── dependency_checker.py  # Circular dependency DFS
│   │   │   └── status_updater.py      # Status cascade logic
│   │   └── tests/                   # Test cases
│   └── requirements.txt
└── task_dependency_frontend/        # React frontend
    ├── src/
    │   ├── components/              # UI components
    │   ├── graph/                   # Graph visualization
    │   ├── services/                # API client
    │   └── utils/                   # Constants, validators
    └── package.json
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd task_dependency_backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run migrations:
   ```bash
   python manage.py migrate
   ```

5. Start the development server:
   ```bash
   python manage.py runserver
   ```

The backend API will be available at `http://localhost:8000/api/`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd task_dependency_frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tasks/` | GET | List all tasks |
| `/api/tasks/` | POST | Create new task |
| `/api/tasks/{id}/` | GET | Get task detail |
| `/api/tasks/{id}/` | PATCH | Update task |
| `/api/tasks/{id}/` | DELETE | Delete task |
| `/api/tasks/{id}/dependencies/` | POST | Add dependency |
| `/api/tasks/{id}/dependencies/{dep_id}/` | DELETE | Remove dependency |
| `/api/dependencies/graph/` | GET | Get full graph data |

## Status Workflow

Tasks can have the following statuses:
- **Pending:** Waiting for dependencies to complete
- **In Progress:** All dependencies completed, ready to work
- **Completed:** Task is finished
- **Blocked:** One or more dependencies are blocked

### Auto-Status Rules

| Dependency State | Task Status |
|------------------|-------------|
| All dependencies completed | `in_progress` |
| Any dependency blocked | `blocked` |
| Mixed (pending/in_progress) | `pending` |
| No dependencies | User-controlled |

## Running Tests

```bash
cd task_dependency_backend
python manage.py test tasks
```

## License

This project is part of an assignment and is not licensed for public use.
