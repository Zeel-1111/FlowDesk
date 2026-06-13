namespace FlowDesk.Core.Interfaces;

using FlowDesk.Core.Entities;

public interface ITaskRepository
{
    Task<IEnumerable<TaskItem>> GetAllAsync();
    Task<TaskItem?> GetByIdAsync(Guid id);
    Task<TaskItem> CreateAsync(TaskItem task);
    Task<TaskItem?> UpdateAsync(Guid id, TaskItem task);
    Task<bool> DeleteAsync(Guid id);
}