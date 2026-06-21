namespace FlowDesk.Infrastructure.Services;

using System.Text;
using System.Text.Json;
using FlowDesk.Core.DTOs;
using FlowDesk.Core.Entities;
using FlowDesk.Core.Entities.Enums;
using FlowDesk.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using TaskStatus = FlowDesk.Core.Entities.Enums.TaskStatus;

public class GeminiTaskService : IAITaskService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    public GeminiTaskService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _apiKey = configuration["Gemini:ApiKey"]!;
    }

    public async Task<AITaskSuggestionDto> ParseTaskFromTextAsync(string input)
    {
        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");

        var prompt = $$"""
            You are a task parsing assistant. Convert the user's natural language input into a structured task.
            Today's date is {{today}}.

            Return ONLY valid JSON (no markdown, no explanation) in this exact format:
            {
              "title": "short clear title",
              "description": "a short 1-sentence description expanding on the title (never null, always provide something useful)",
              "priority": 1 | 2 | 3,
              "status": 1,
              "dueDate": "YYYY-MM-DDTHH:mm:ssZ or null"
            }

            Priority mapping: 1 = Low, 2 = Medium, 3 = High.
            Status is always 1 (Todo) for new tasks.
            If no due date is mentioned, set dueDate to null.
            If urgency words like "urgent", "asap", "important" appear, set priority to 3.

            User input: "{{input}}"
            """;

        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[] { new { text = prompt } }
                }
            }
        };

        var json = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={_apiKey}"; 
        var response = await _httpClient.PostAsync(url, content);
        response.EnsureSuccessStatusCode();

        var responseBody = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(responseBody);

        var text = doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString() ?? "{}";

        // Clean up — Gemini sometimes wraps JSON in markdown code fences
        text = text.Replace("```json", "").Replace("```", "").Trim();

        var parsed = JsonSerializer.Deserialize<GeminiParsedTask>(text, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        return new AITaskSuggestionDto
        {
            Title = parsed?.Title ?? "Untitled Task",
            Description = parsed?.Description,
            Priority = (Priority)(parsed?.Priority ?? 2),
            Status = TaskStatus.Todo,
            DueDate = string.IsNullOrEmpty(parsed?.DueDate) ? null : DateTime.Parse(parsed.DueDate)
        };
    }

    private class GeminiParsedTask
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public int? Priority { get; set; }
        public string? DueDate { get; set; }
    }
}