import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../api/tasks';
import { type Task, type CreateTaskDto, TaskStatus } from '../types';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import { useTaskHub } from '../hooks/useTaskHub';
import { toast } from 'react-hot-toast';
const columns: { status: TaskStatus; label: string; color: string }[] = [
  { status: TaskStatus.Todo, label: 'To Do', color: 'bg-gray-100' },
  { status: TaskStatus.InProgress, label: 'In Progress', color: 'bg-blue-50' },
  { status: TaskStatus.InReview, label: 'In Review', color: 'bg-yellow-50' },
  { status: TaskStatus.Done, label: 'Done', color: 'bg-green-50' },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await taskService.getAll();
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  useTaskHub({
    onTaskCreated: (task) => {
      toast.success(`New task created: ${task.title}`, { id: `create-${task.id}` });
      setTasks((prev) => {
        if (prev.some((t) => t.id === task.id)) return prev; // avoid dup if same tab triggered it
        return [task, ...prev];
      });
    },
    onTaskUpdated: (task) => {
      toast.success(`Task updated: ${task.title}`, { id: `update-${task.id}` });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    },
    onTaskDeleted: (taskId : any) => {
      toast.success(`Task deleted`, { id: `delete-${taskId}` });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    },
  });
  const handleCreate = async (values: CreateTaskDto) => {
    await taskService.create(values);
    setShowForm(false);
    loadTasks();
  };

  const handleUpdate = async (values: CreateTaskDto) => {
    if (!editingTask) return;
    await taskService.update(editingTask.id, values);
    setEditingTask(undefined);
    setShowForm(false);
    loadTasks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    await taskService.delete(id);
    loadTasks();
  };

  const openEditForm = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTask(undefined);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">FlowDesk</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Hi, {user?.name}</span>
            <button onClick={logout} className="text-sm text-red-600 hover:underline">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">My Tasks</h2>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
          >
            + New Task
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h3 className="font-semibold mb-3">{editingTask ? 'Edit Task' : 'New Task'}</h3>
            <TaskForm
              initialData={editingTask}
              onSubmit={editingTask ? handleUpdate : handleCreate}
              onCancel={closeForm}
            />
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Loading tasks...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {columns.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.status);
              return (
                <div key={col.status} className={`rounded-lg p-3 ${col.color}`}>
                  <h3 className="font-semibold text-sm mb-3 flex items-center justify-between">
                    {col.label}
                    <span className="text-xs bg-white rounded-full px-2 py-0.5 text-gray-500">
                      {colTasks.length}
                    </span>
                  </h3>

                  {colTasks.length === 0 ? (
                    <p className="text-xs text-gray-400">No tasks</p>
                  ) : (
                    colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={openEditForm}
                        onDelete={handleDelete}
                      />
                    ))
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
