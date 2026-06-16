using FlowDesk.Core.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FlowDesk.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpPost("trigger-check")]
        public async Task<IActionResult> TriggerCheck()
        {
            await _notificationService.CheckAndSendDueNotificationsAsync();
            return Ok("Check triggered");
        }
    }
}
