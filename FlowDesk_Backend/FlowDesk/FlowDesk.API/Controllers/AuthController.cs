namespace FlowDesk.API.Controllers;

using FlowDesk.Core.DTOs;
using FlowDesk.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("resend-otp")]
    public async Task<IActionResult> ResendOtp([FromBody] ResendOtpDto dto)
    {
        try
        {
            await _authService.ResendOtpAsync(dto.Email);
            return Ok(new { message = "OTP resent successfully." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        try
        {
            var result = await _authService.RegisterAsync(dto);
            return Ok(new
            {
                message = "OTP sent to your email. Please verify to continue.",
                email = result.Email,
                isEmailVerified = result.IsEmailVerified,
            });
        }
        catch (InvalidOperationException ex) when (ex.Message == "EMAIL_EXISTS")
        {
            return BadRequest(new { message = "Email already registered. Please login instead." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Registration failed.", error = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var result = await _authService.LoginAsync(dto);
        if (result is null)
            return Unauthorized(new { message = "Invalid email or password" });

        if (!result.IsEmailVerified)
            return StatusCode(403, new { message = "Please verify your email. Check your inbox for the OTP." });

        return Ok(result);
    }

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto)
    {
        var success = await _authService.VerifyOtpAsync(dto.Email, dto.Otp);
        if (!success)
            return BadRequest(new { message = "Invalid or expired OTP." });

        return Ok(new { message = "Email verified! You can now log in." });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        await _authService.ForgotPasswordAsync(dto.Email);
        // Always return success to prevent email enumeration
        return Ok(new { message = "If an account exists with that email, a password reset code has been sent." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        var success = await _authService.ResetPasswordAsync(dto.Email, dto.Otp, dto.NewPassword);
        if (!success)
            return BadRequest(new { message = "Invalid or expired reset code." });

        return Ok(new { message = "Password reset successfully! You can now log in with your new password." });
    }
}