namespace FlowDesk.Core.Interfaces;

public interface IEmailService
{
    Task SendOtpEmailAsync(string toEmail, string toName, string otp);
    Task SendPasswordResetOtpEmailAsync(string toEmail, string toName, string otp);
}