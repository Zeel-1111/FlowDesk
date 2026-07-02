import { type TaskFilters, Priority, TaskStatus } from '../types';

interface FilterBarProps {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  onClear: () => void;
}

export default function FilterBar({ filters, onChange, onClear }: FilterBarProps) {
  const hasActiveFilters = filters.search || filters.priority !== 0 || filters.status !== 0;

  return (
    <div className="bg-white rounded-lg shadow p-3 mb-4 flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="flex-1 min-w-48">
        <input
          type="text"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Priority filter */}
      <select
        value={filters.priority}
        onChange={(e) => onChange({ ...filters, priority: Number(e.target.value) as Priority | 0 })}
        className="border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value={0}>All Priorities</option>
        <option value={Priority.Low}>Low</option>
        <option value={Priority.Medium}>Medium</option>
        <option value={Priority.High}>High</option>
      </select>

      {/* Status filter */}
      <select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: Number(e.target.value) as TaskStatus | 0 })}
        className="border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value={0}>All Statuses</option>
        <option value={TaskStatus.Todo}>To Do</option>
        <option value={TaskStatus.InProgress}>In Progress</option>
        <option value={TaskStatus.InReview}>In Review</option>
        <option value={TaskStatus.Done}>Done</option>
      </select>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="text-sm text-red-500 hover:underline whitespace-nowrap"
        >
          Clear filters
        </button>
      )}

      {/* Active filter count */}
      {hasActiveFilters && (
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
          Filters active
        </span>
      )}
    </div>
  );
}