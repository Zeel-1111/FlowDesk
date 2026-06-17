using FlowDesk.Core.DTOs;
using FlowDesk.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FlowDesk.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly INotificationRepository _notificationRepository;

        public NotificationsController(INotificationService notificationService, INotificationRepository notificationRepository)
        {
            _notificationService = notificationService;
            _notificationRepository = notificationRepository;
        }

        private Guid GetUserId() =>
            Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

        [HttpGet("unread")]
        public async Task<IActionResult> GetUnread()
        {
            var notifications = await _notificationRepository.GetUnreadAsync(GetUserId());
            var response = notifications.Select(n => new NotificationDto
            {
                Id = n.Id,
                TaskId = n.TaskId,
                Title = n.Title,
                Message = n.Message,
                Type = n.Type,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt,
            });

            return Ok(response);
        }

        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            await _notificationRepository.MarkAsReadAsync(id, GetUserId());
            return NoContent(); 
        }

        [HttpPatch("read-all")]
        public async Task<IActionResult> MarkAllAsRead(Guid id) {
            await _notificationRepository.MarkAllAsReadAsync(GetUserId());
            return NoContent();
        }

        [HttpPost("trigger-check")]
        public async Task<IActionResult> TriggerCheck()
        {
            await _notificationService.CheckAndSendDueNotificationsAsync();
            return Ok(new { message = "Due date check triggered" });
        }
    }
}
