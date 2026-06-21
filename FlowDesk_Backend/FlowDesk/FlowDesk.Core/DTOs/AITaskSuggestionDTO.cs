namespace FlowDesk.Core.DTOs;

using FlowDesk.Core.Entities;
using FlowDesk.Core.Entities.Enums;
using TaskStatus = FlowDesk.Core.Entities.Enums.TaskStatus;

public class AITaskSuggestionDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Priority Priority { get; set; } = Priority.Medium;
    public TaskStatus Status { get; set; } = TaskStatus.Todo;
    public DateTime? DueDate { get; set; }
}