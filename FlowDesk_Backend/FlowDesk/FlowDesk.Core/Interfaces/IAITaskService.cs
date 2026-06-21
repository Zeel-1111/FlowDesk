namespace FlowDesk.Core.Interfaces;

using FlowDesk.Core.DTOs;

public interface IAITaskService
{
    Task<AITaskSuggestionDto> ParseTaskFromTextAsync(string input);
}