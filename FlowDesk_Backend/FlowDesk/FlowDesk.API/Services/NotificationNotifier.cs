namespace FlowDesk.API.Services;

using FlowDesk.API.Hubs;
using FlowDesk.Core.DTOs;
using FlowDesk.Core.Interfaces;
using Microsoft.AspNetCore.SignalR;

public class NotificationNotifier : INotificationNotifier
{
    private readonly IHubContext<TaskHub> _hubContext;

    public NotificationNotifier(IHubContext<TaskHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task SendNotificationAsync(Guid userId, NotificationDto notification)
        => await _hubContext.Clients
            .Group(userId.ToString())
            .SendAsync("NotificationReceived", notification);
}