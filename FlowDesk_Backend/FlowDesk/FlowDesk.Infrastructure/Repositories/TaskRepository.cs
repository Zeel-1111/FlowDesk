using FlowDesk.Core.Entities;
using FlowDesk.Core.Interfaces;
using FlowDesk.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlowDesk.Infrastructure.Repositories
{
    public class TaskRepository : ITaskRepository
    {
        private readonly AppDbContext _context;

        public TaskRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<TaskItem>> GetAllAsync()
            => await _context.Tasks.OrderByDescending(t => t.CreatedAt).ToListAsync();

        public async Task<TaskItem?> GetByIdAsync(Guid id)
            => await _context.Tasks.FindAsync(id);

        public async Task<TaskItem> CreateAsync(TaskItem task)
        {
            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();
            return task;
        }

        public async Task<TaskItem?> UpdateAsync(Guid id, TaskItem updated)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task is null) return null;

            task.Title = updated.Title;
            task.Description = updated.Description;
            task.IsCompleted = updated.IsCompleted;
            task.Priority = updated.Priority;
            task.DueDate = updated.DueDate;
            task.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return task;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task is null) return false;

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();
            return true;
        }

    }
}