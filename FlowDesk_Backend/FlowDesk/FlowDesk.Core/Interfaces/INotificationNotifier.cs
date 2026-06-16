namespace FlowDesk.Core.Interfaces;

using FlowDesk.Core.DTOs;

public interface INotificationNotifier
{
    Task SendNotificationAsync(Guid userId, NotificationDto notification);
}