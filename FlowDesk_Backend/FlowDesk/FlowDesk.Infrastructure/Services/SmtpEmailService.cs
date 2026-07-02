namespace FlowDesk.Infrastructure.Services;

using System.Net;
using System.Net.Mail;
using FlowDesk.Core.Interfaces;
using Microsoft.Extensions.Configuration;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _configuration;

    public SmtpEmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendOtpEmailAsync(string toEmail, string toName, string otp)
    {
        var fromName = _configuration["Email:FromName"] ?? "FlowDesk";
        var fromEmail = _configuration["Email:Username"]!;
        var host = _configuration["Email:Host"]!;
        var port = int.Parse(_configuration["Email:Port"] ?? "587");
        var password = _configuration["Email:Password"]!;

        Console.WriteLine($"Username: '{fromEmail}'");
        Console.WriteLine($"Recipient: '{toEmail}'");

        var from = new MailAddress(fromEmail.Trim());
        var to = new MailAddress(toEmail.Trim());

        using var message = new MailMessage(from, to)
        {
            Subject = "Your FlowDesk verification code",
            IsBodyHtml = true,
            Body = $"""
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

        using var client = new SmtpClient(host, port)
        {
            Credentials = new NetworkCredential(fromEmail, password),
            EnableSsl = true
        };

        await client.SendMailAsync(message);
    }

    public async Task SendPasswordResetOtpEmailAsync(string toEmail, string toName, string otp)
    {
        var fromName = _configuration["Email:FromName"] ?? "FlowDesk";
        var fromEmail = _configuration["Email:Username"]!;
        var host = _configuration["Email:Host"]!;
        var port = int.Parse(_configuration["Email:Port"] ?? "587");
        var password = _configuration["Email:Password"]!;

        var from = new MailAddress(fromEmail.Trim());
        var to = new MailAddress(toEmail.Trim());

        using var message = new MailMessage(from, to)
        {
            Subject = "Reset your FlowDesk password",
            IsBodyHtml = true,
            Body = $"""
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

        using var client = new SmtpClient(host, port)
        {
            Credentials = new NetworkCredential(fromEmail, password),
            EnableSsl = true
        };

        await client.SendMailAsync(message);
    }
}