using FlowDesk.API.Hubs;
using FlowDesk.Core.DTOs;
using FlowDesk.Core.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace FlowDesk.API.Services
{
    public class TaskNotifier : ITaskNotifier
    {
        private readonly IHubContext<TaskHub> _hubContext;

        public TaskNotifier(IHubContext<TaskHub> hubContext)
        {
            _hubContext = hubContext;
        }
        public async Task TaskCreated(Guid userId, TaskResponseDto task)
            => await _hubContext.Clients.Group(userId.ToString()).SendAsync("TaskCreated", task);

        public async Task TaskUpdated(Guid userId, TaskResponseDto task)
            => await _hubContext.Clients.Group(userId.ToString()).SendAsync("TaskUpdated", task);

        public async Task TaskDeleted(Guid userId, Guid taskId)
        => await _hubContext.Clients.Group(userId.ToString()).SendAsync("TaskDeleted", taskId);
    }
}
