import { type Task, Priority } from '../types/index';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const priorityColors: Record<Priority, string> = {
  [Priority.Low]: 'bg-green-100 text-green-700',
  [Priority.Medium]: 'bg-yellow-100 text-yellow-700',
  [Priority.High]: 'bg-red-100 text-red-700',
};

const priorityLabels: Record<Priority, string> = {
  [Priority.Low]: 'Low',
  [Priority.Medium]: 'Medium',
  [Priority.High]: 'High',
};

export default function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-3 mb-3 border border-gray-100">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-sm">{task.title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${priorityColors[task.priority]}`}>
          {priorityLabels[task.priority]}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
      )}

      {task.dueDate && (
        <p className="text-xs text-gray-400 mt-2">
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </p>
      )}

      <div className="flex gap-3 mt-2">
        <button onClick={() => onEdit(task)} className="text-xs text-blue-600 hover:underline">
          Edit
        </button>
        <button onClick={() => onDelete(task.id)} className="text-xs text-red-600 hover:underline">
          Delete
        </button>
      </div>
    </div>
  );
}