namespace FlowDesk.API.Controllers;

using FlowDesk.Core.DTOs;
using FlowDesk.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AIController : ControllerBase
{
    private readonly IAITaskService _aiTaskService;

    public AIController(IAITaskService aiTaskService)
    {
        _aiTaskService = aiTaskService;
    }

    [HttpPost("parse-task")]
    public async Task<IActionResult> ParseTask([FromBody] ParseTaskRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Input))
            return BadRequest(new { message = "Input cannot be empty" });

        try
        {
            var suggestion = await _aiTaskService.ParseTaskFromTextAsync(dto.Input);
            return Ok(suggestion);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "AI parsing failed", error = ex.Message });
        }
    }
}