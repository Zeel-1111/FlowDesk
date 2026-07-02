using FlowDesk.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace FlowDesk.Infrastructure.Services
{
    public class ResendEmailService : IEmailService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public ResendEmailService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["Resend:ApiKey"]!;
        }

        public async Task SendOtpEmailAsync(string toEmail, string toName, string otp)
        {
            var emailBody = new
            {
                from = "FlowDesk <onboarding@resend.dev>",
                to = new[] { toEmail },
                subject = "Your FlowDesk verification code",
                html = $"""
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
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");

            var response = await _httpClient.PostAsync("https://api.resend.com/emails", content);
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"Resend API error {response.StatusCode}: {errorBody}");
            }
            response.EnsureSuccessStatusCode();

        }

        public async Task SendPasswordResetOtpEmailAsync(string toEmail, string toName, string otp)
        {
            var emailBody = new
            {
                from = "FlowDesk <onboarding@resend.dev>",
                to = new[] { toEmail },
                subject = "Reset your FlowDesk password",
                html = $"""
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
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");

            var response = await _httpClient.PostAsync("https://api.resend.com/emails", content);
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"Resend API error {response.StatusCode}: {errorBody}");
            }
            response.EnsureSuccessStatusCode();
        }
    }
}
