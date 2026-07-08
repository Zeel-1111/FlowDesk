namespace FlowDesk.Infrastructure.Services;

using System.Net;
using System.Net.Http;
using System.Net.Mail;
using System.Text;
using System.Text.Json;
using FlowDesk.Core.Interfaces;
using Microsoft.Extensions.Configuration;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;
    public SmtpEmailService(IConfiguration configuration, HttpClient httpClient)
    {
        _configuration = configuration;
        _httpClient = httpClient;
    }

    public async Task SendOtpEmailAsync(string toEmail, string toName, string otp)
    {
        var apiKey = _configuration["Brevo:ApiKey"]!;
        var fromEmail = _configuration["Brevo:FromEmail"]!;
        var fromName = _configuration["Brevo:FromName"] ?? "FlowDesk";

        var emailBody = new
        {
            sender = new { name = fromName, email = fromEmail },
            to = new[] { new { email = toEmail, name = toName } },
            subject = "Your FlowDesk verification code",
            htmlContent = $"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #2563eb;">Welcome to FlowDesk! 👋</h1>
                    <p>Hi {toName},</p>
                    <p>Your email verification code is:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 42px; font-weight: bold; letter-spacing: 12px;
                                     color: #2563eb; background: #eff6ff; padding: 16px 24px;
                                     border-radius: 8px;">
                            {otp}
                        </span>
                    </div>
                    <p style="color: #6b7280; font-size: 14px;">
                        This code expires in <strong>10 minutes</strong>.
                        If you didn't create an account, ignore this email.
                    </p>
                </div>
                """
        };

        var json = JsonSerializer.Serialize(emailBody);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Add("api-key", apiKey);
        _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");

        var response = await _httpClient.PostAsync(
            "https://api.brevo.com/v3/smtp/email", content);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new Exception($"Brevo error {response.StatusCode}: {error}");
        }
    }


    public async Task SendPasswordResetOtpEmailAsync(string toEmail, string toName, string otp)
    {
        var apiKey = _configuration["Brevo:ApiKey"]!;
        var fromEmail = _configuration["Brevo:FromEmail"]!;
        var fromName = _configuration["Brevo:FromName"] ?? "FlowDesk";

        var from = new MailAddress(fromEmail.Trim());
        var to = new MailAddress(toEmail.Trim());

        var emailBody = new
        {
            sender = new { name = fromName, email = fromEmail },
            to = new[] { new { email = toEmail, name = toName } },
            subject = "Reset your FlowDesk password",
            htmlContent = $"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #d97706;">Password Reset Request 🔒</h1>

                    <p>Hi {toName},</p>

                    <p>We received a request to reset your FlowDesk password. Use the code below to set a new password:</p>

                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 42px; font-weight: bold; letter-spacing: 12px;
                                     color: #d97706; background: #fffbeb; padding: 16px 24px;
                                     border-radius: 8px;">
                            {otp}
                        </span>
                    </div>

                    <p style="color: #6b7280; font-size: 14px;">
                        This code expires in <strong>10 minutes</strong>.
                        If you didn't request a password reset, you can safely ignore this email.
                    </p>
                </div>
                """
        };

        var json = JsonSerializer.Serialize(emailBody);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Add("api-key", apiKey);
        _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");

        var response = await _httpClient.PostAsync(
            "https://api.brevo.com/v3/smtp/email", content);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new Exception($"Brevo error {response.StatusCode}: {error}");
        }
    }
}