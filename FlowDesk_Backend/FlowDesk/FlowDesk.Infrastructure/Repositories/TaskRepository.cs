namespace FlowDesk.Infrastructure.Repositories;

using FlowDesk.Core.Entities;
using FlowDesk.Core.Interfaces;
using FlowDesk.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public class TaskRepository : ITaskRepository
{
    private readonly AppDbContext _context;
    private readonly ICacheService _cache;

    public TaskRepository(AppDbContext context, ICacheService cache)
    {
        _context = context;
        _cache = cache;
    }

    private string CacheKey(Guid userId) => $"tasks:{userId}";

    public async Task<IEnumerable<TaskItem>> GetAllAsync(Guid userId)
    {
        var cacheKey = CacheKey(userId);
        var cached = await _cache.GetAsync<List<TaskItem>>(cacheKey);
        if (cached is not null) return cached;

        var tasks = await _context.Tasks
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        await _cache.SetAsync(cacheKey, tasks, TimeSpan.FromMinutes(5));
        return tasks;
    }

    public async Task<TaskItem?> GetByIdAsync(Guid id, Guid userId)
        => await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

    public async Task<TaskItem> CreateAsync(TaskItem task)
    {
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();
        await _cache.RemoveAsync(CacheKey(task.UserId));
        return task;
    }

    public async Task<TaskItem?> UpdateAsync(Guid id, Guid userId, TaskItem updated)
    {
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        if (task is null) return null;

        task.Title = updated.Title;
        task.Description = updated.Description;
        task.Status = updated.Status;
        task.Priority = updated.Priority;
        task.DueDate = updated.DueDate;
        task.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _cache.RemoveAsync(CacheKey(userId));
        return task;
    }

    public async Task<bool> DeleteAsync(Guid id, Guid userId)
    {
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        if (task is null) return false;

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();
        await _cache.RemoveAsync(CacheKey(userId));
        return true;
    }
}