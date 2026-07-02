import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from '@dnd-kit/core';

import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../api/tasks';
import { notificationService } from '../api/notifications';
import { useTaskHub } from '../hooks/useTaskHub';
import {
  type Task,
  type CreateTaskDto,
  type NotificationDto,
  type AITaskSuggestion,
  type TaskFilters,
  TaskStatus,

} from '../types';
import KanbanColumn from '../components/KanbanColumn';

import TaskForm from '../components/TaskForm';
import NotificationBell from '../components/NotificationBell';
import AITaskInput from '../components/AITaskInput';
import FilterBar from '../components/FilterBar';

const columns: { status: TaskStatus; label: string; color: string }[] = [
  { status: TaskStatus.Todo, label: 'To Do', color: 'bg-gray-100' },
  { status: TaskStatus.InProgress, label: 'In Progress', color: 'bg-blue-50' },
  { status: TaskStatus.InReview, label: 'In Review', color: 'bg-yellow-50' },
  { status: TaskStatus.Done, label: 'Done', color: 'bg-green-50' },
];

const defaultFilters: TaskFilters = { search: '', priority: 0, status: 0 };

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAIInput, setShowAIInput] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [aiSuggestion, setAiSuggestion] = useState<AITaskSuggestion | undefined>(undefined);
  const [filters, setFilters] = useState<TaskFilters>(defaultFilters);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // DnD sensors — require 8px movement before drag starts (prevents accidental drags)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await taskService.getAll();
      setTasks(data);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getUnread();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    loadTasks();
    loadNotifications();
  }, []);

  useTaskHub({
    onTaskCreated: (task) => {
      setTasks((prev) => (prev.some((t) => t.id === task.id) ? prev : [task, ...prev]));
    },
    onTaskUpdated: (task) => {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    },
    onTaskDeleted: (taskId) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    },
    onNotificationReceived: (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      toast(notification.title, {
        icon: '🔔',
        duration: 5000,
        style: {
          borderRadius: '8px',
          background: '#fef3c7',
          color: '#92400e',
          fontSize: '14px',
        },
      });
    },
  });

  // DnD handlers
  const dragOriginalStatus = useRef<TaskStatus | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
    dragOriginalStatus.current = task?.status ?? null;
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find what column we're dragging over
    const overColumn = columns.find((c) => c.status.toString() === overId);
    const activeTask = tasks.find((t) => t.id === activeId);

    if (!activeTask) return;

    if (overColumn && activeTask.status !== overColumn.status) {
      // Optimistically update status in UI
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: overColumn.status } : t
        )
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const originalStatus = dragOriginalStatus.current;
    setActiveTask(null);
    dragOriginalStatus.current = null;

    if (!over) {
      // Dropped outside — revert optimistic update
      loadTasks();
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTaskItem = tasks.find((t) => t.id === activeId);
    if (!activeTaskItem) return;

    // Find target column — either dropping directly on a column,
    // or on a task card within that column
    const targetColumn = columns.find((c) => c.status.toString() === overId);
    let targetStatus: TaskStatus;

    if (targetColumn) {
      targetStatus = targetColumn.status;
    } else {
      // Dropped on a task card — use that task's current (optimistically updated) status
      const overTask = tasks.find((t) => t.id === overId);
      targetStatus = overTask?.status ?? activeTaskItem.status;
    }

    // Compare against the ORIGINAL status (before optimistic update), not current
    if (originalStatus === targetStatus) return;

    try {
      await taskService.update(activeId, {
        title: activeTaskItem.title,
        description: activeTaskItem.description,
        priority: activeTaskItem.priority,
        dueDate: activeTaskItem.dueDate,
        status: targetStatus,
      });
      toast.success(`Moved to ${columns.find((c) => c.status === targetStatus)?.label}`);
    } catch {
      // Revert optimistic update on failure
      loadTasks();
      toast.error('Failed to move task');
    }
  };

  const handleCreate = async (values: CreateTaskDto) => {
    try {
      await taskService.create(values);
      setShowForm(false);
      setAiSuggestion(undefined);
      toast.success('Task created!');
    } catch {
      toast.error('Failed to create task');
    }
  };

  const handleUpdate = async (values: CreateTaskDto) => {
    if (!editingTask) return;
    try {
      await taskService.update(editingTask.id, values);
      setEditingTask(undefined);
      setShowForm(false);
      toast.success('Task updated!');
    } catch {
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await taskService.delete(id);
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const openEditForm = (task: Task) => {
    setEditingTask(task);
    setAiSuggestion(undefined);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTask(undefined);
    setAiSuggestion(undefined);
  };

  const handleAISuggestion = (suggestion: AITaskSuggestion) => {
    setAiSuggestion(suggestion);
    setShowAIInput(false);
    setShowForm(true);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      !filters.search ||
      task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      task.description?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesPriority = filters.priority === 0 || task.priority === filters.priority;
    const matchesStatus = filters.status === 0 || task.status === filters.status;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">FlowDesk</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Hi, {user?.name}</span>
            <NotificationBell
              notifications={notifications}
              onMarkAsRead={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
              onMarkAllAsRead={() => setNotifications([])}
            />
            <button onClick={logout} className="text-sm text-red-600 hover:underline">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">My Tasks</h2>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowAIInput(true); setShowForm(false); }}
              className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700"
            >
              ✨ AI Create
            </button>
            <button
              onClick={() => { setShowForm(true); setShowAIInput(false); setAiSuggestion(undefined); setEditingTask(undefined); }}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              + New Task
            </button>
          </div>
        </div>

        {showAIInput && (
          <AITaskInput onSuggestion={handleAISuggestion} onCancel={() => setShowAIInput(false)} />
        )}

        {showForm && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h3 className="font-semibold mb-3">
              {editingTask ? 'Edit Task' : aiSuggestion ? '✨ AI Suggested Task' : 'New Task'}
            </h3>
            <TaskForm
              initialData={editingTask}
              aiSuggestion={aiSuggestion}
              onSubmit={editingTask ? handleUpdate : handleCreate}
              onCancel={closeForm}
            />
          </div>
        )}

        <FilterBar
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters(defaultFilters)}
        />

        {loading ? (
          <p className="text-gray-500">Loading tasks...</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {columns.map((col) => (
                <KanbanColumn
                  key={col.status}
                  status={col.status}
                  label={col.label}
                  color={col.color}
                  tasks={filteredTasks.filter((t) => t.status === col.status)}
                  onEdit={openEditForm}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {/* Drag overlay — shows card while dragging */}
            <DragOverlay>
              {activeTask ? (
                <div className="bg-white rounded-lg shadow-xl p-3 border-2 border-blue-400 opacity-90 rotate-2">
                  <p className="font-medium text-sm">{activeTask.title}</p>
                  {activeTask.description && (
                    <p className="text-xs text-gray-500 mt-1">{activeTask.description}</p>
                  )}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>
    </div>
  );
}