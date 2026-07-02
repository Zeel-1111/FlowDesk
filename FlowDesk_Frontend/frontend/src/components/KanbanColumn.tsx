import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { type Task, type TaskStatus } from '../types';
import TaskCard from './TaskCard';

interface KanbanColumnProps {
  status: TaskStatus;
  label: string;
  color: string;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export default function KanbanColumn({
  status,
  label,
  color,
  tasks,
  onEdit,
  onDelete,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status.toString() });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg p-3 transition-colors duration-200 
        ${color} ${isOver ? 'ring-2 ring-blue-400 ring-opacity-60' : ''}`}
    >
      <h3 className="font-semibold text-sm mb-3 flex items-center justify-between">
        {label}
        <span className="text-xs bg-white rounded-full px-2 py-0.5 text-gray-500">
          {tasks.length}
        </span>
      </h3>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {tasks.length === 0 ? (
          <div className={`min-h-24 rounded-lg border-2 border-dashed 
            ${isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'} 
            flex items-center justify-center`}
          >
            <p className="text-xs text-gray-400">Drop here</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </SortableContext>
    </div>
  );
}