namespace FlowDesk.Core.Interfaces;

using FlowDesk.Core.Entities;
using FlowDesk.Core.Entities.Enums;

public interface INotificationRepository
{
    Task<IEnumerable<Notification>> GetUnreadAsync(Guid userId);  // ← only unread
    Task<Notification> CreateAsync(Notification notification);
    Task MarkAsReadAsync(Guid id, Guid userId);
    Task MarkAllAsReadAsync(Guid userId);
    Task<bool> ExistsAsync(Guid taskId, NotificationType type);
}