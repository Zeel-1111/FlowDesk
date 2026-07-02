namespace FlowDesk.Core.Interfaces;

using FlowDesk.Core.DTOs;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto?> LoginAsync(LoginDto dto);
    Task<bool> VerifyOtpAsync(string email, string otp);
    Task ResendOtpAsync(string email);
    Task ForgotPasswordAsync(string email);
    Task<bool> ResetPasswordAsync(string email, string otp, string newPassword);
}