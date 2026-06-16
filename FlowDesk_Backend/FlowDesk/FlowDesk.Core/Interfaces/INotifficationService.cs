namespace FlowDesk.Core.Interfaces;

public interface INotificationService
{
    Task CheckAndSendDueNotificationsAsync();
}