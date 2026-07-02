import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type Task, Priority } from '../types';

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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg shadow p-3 mb-3 border border-gray-100 
        ${isDragging ? 'ring-2 ring-blue-400' : ''}`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center gap-1 mb-2 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="4" r="1.5" />
          <circle cx="11" cy="4" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="11" cy="12" r="1.5" />
        </svg>
        <span className="text-xs text-gray-300">drag</span>
      </div>

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
        <button
          onClick={() => onEdit(task)}
          className="text-xs text-blue-600 hover:underline"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="text-xs text-red-600 hover:underline"
        >
          Delete
        </button>
      </div>
    </div>
  );
}