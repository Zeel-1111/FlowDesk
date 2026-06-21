namespace FlowDesk.Infrastructure.Services;

using FlowDesk.Core.DTOs;
using FlowDesk.Core.Entities;
using FlowDesk.Core.Entities.Enums;
using FlowDesk.Core.Interfaces;
using FlowDesk.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationNotifier _notificationNotifier;

    public NotificationService(AppDbContext context, INotificationRepository notificationRepository, INotificationNotifier notificationNotifier)
    {
        _context = context;
        _notificationRepository = notificationRepository;
        _notificationNotifier = notificationNotifier;
    }

    public async Task CheckAndSendDueNotificationsAsync()
    {
        var now = DateTime.UtcNow;
        var inHour = now.AddHours(1);
        var in24Hours = now.AddHours(48);

        var tasks = await _context.Tasks.
            Include(t => t.User)
            .Where(
                t => t.DueDate.HasValue &&
                t.Status != TaskStatus.Done &&
                t.UserId != Guid.Empty
            ).ToListAsync();

        foreach (var task in tasks)
        {
            var due = task.DueDate!.Value;

            if (due >= now && (due <= inHour || due <= in24Hours))
            {
                var alreadySent = await _notificationRepository
                    .ExistsAsync(task.Id, NotificationType.DueIn1Hour);

                if (!alreadySent)
                {

                    var notification = await _notificationRepository.CreateAsync(new Notification
                    {
                        UserId = task.UserId,
                        TaskId = task.Id,
                        Title = "Task due very soon!",
                        Message = $"\"{task.Title}\" is due within the next hour.",
                        Type = NotificationType.DueIn1Hour,
                        CreatedAt = DateTime.UtcNow,
                    });

                    await _notificationNotifier.SendNotificationAsync(task.UserId, MapToDto(notification));
                }

                else if (due >= now && due <= in24Hours)
                {
                    alreadySent = await _notificationRepository
                        .ExistsAsync(task.Id, NotificationType.DueIn24Hours);

                    if (!alreadySent)
                    {
                        var notification = await _notificationRepository.CreateAsync(new Notification
                        {
                            UserId = task.UserId,
                            TaskId = task.Id,
                            Title = "Task due tomorrow",
                            Message = $"\"{task.Title}\" is due within the next 24 hours.",
                            Type = NotificationType.DueIn24Hours,
                            CreatedAt = DateTime.UtcNow,
                        });

                        await _notificationNotifier.SendNotificationAsync(task.UserId, MapToDto(notification));
                    }
                }
            }
        }
    }

    private static NotificationDto MapToDto(Notification n) => new()
    {
        Id = n.Id,
        TaskId = n.TaskId,
        Title = n.Title,
        Message = n.Message,
        Type = n.Type,
        IsRead = n.IsRead,
        CreatedAt = n.CreatedAt,
    };
}