namespace FlowDesk.Core.Interfaces;

using FlowDesk.Core.Entities;

public interface ITaskRepository
{
    Task<IEnumerable<TaskItem>> GetAllAsync(Guid userId);
    Task<TaskItem?> GetByIdAsync(Guid id, Guid userId);
    Task<TaskItem> CreateAsync(TaskItem task);
    Task<TaskItem?> UpdateAsync(Guid id, Guid userId, TaskItem task);
    Task<bool> DeleteAsync(Guid id, Guid userId);
}