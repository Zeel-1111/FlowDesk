using FlowDesk.API.Services;
using FlowDesk.Core.DTOs;
using FlowDesk.Core.Entities;
using FlowDesk.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TaskStatus = FlowDesk.Core.Entities.Enums.TaskStatus;

namespace FlowDesk.API.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class TasksController : ControllerBase
    {
        private readonly ITaskRepository _taskRepository;
        private readonly ITaskNotifier _taskNotifier;

        public TasksController(ITaskRepository taskRepository, ITaskNotifier taskNotifier)
        {
            _taskRepository = taskRepository;
            _taskNotifier = taskNotifier;
        }

        private Guid GetUserId()
            => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var tasks = await _taskRepository.GetAllAsync(GetUserId());
            return Ok(tasks.Select(MapToResponse));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var task = await _taskRepository.GetByIdAsync(id, GetUserId());
            if (task is null) return NotFound();
            return Ok(MapToResponse(task));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTaskDto dto)
        {
            var task = new TaskItem
            {
                Title = dto.Title,
                Description = dto.Description,
                Status = dto.Status,
                Priority = dto.Priority,
                DueDate = dto.DueDate?.ToUniversalTime(),
                UserId = GetUserId()
            };

            var created = await _taskRepository.CreateAsync(task);
            var response = MapToResponse(created);

            await _taskNotifier.TaskCreated(GetUserId(), response);

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, response);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreateTaskDto dto)
        {
            var task = new TaskItem
            {
                Title = dto.Title,
                Description = dto.Description,
                Status = dto.Status,
                Priority = dto.Priority,
                DueDate = dto.DueDate?.ToUniversalTime()
            };

            var updated = await _taskRepository.UpdateAsync(id, GetUserId(), task);
            if (updated is null) return NotFound();

            var response = MapToResponse(updated);
            await _taskNotifier.TaskUpdated(GetUserId(), response);

            return Ok(MapToResponse(updated));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var deleted = await _taskRepository.DeleteAsync(id, GetUserId());
            if (!deleted) return NotFound();

            await _taskNotifier.TaskDeleted(GetUserId(), id);

            return NoContent();
        }

        private static TaskResponseDto MapToResponse(TaskItem task) => new()
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            Status = task.Status,
            Priority = task.Priority,
            DueDate = task.DueDate,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt
        };
    }
}