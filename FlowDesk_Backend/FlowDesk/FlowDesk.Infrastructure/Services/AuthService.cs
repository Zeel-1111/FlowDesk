namespace FlowDesk.Infrastructure.Services;

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FlowDesk.Core.DTOs;
using FlowDesk.Core.Entities;
using FlowDesk.Core.Interfaces;
using FlowDesk.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        AppDbContext context,
        IConfiguration configuration,
        IEmailService emailService,
        ILogger<AuthService> logger)
    {
        _context = context;
        _configuration = configuration;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == dto.Email);

        if (existingUser is not null)
        {
            if (!existingUser.IsEmailVerified)
            {
                // Resend OTP to same user
                var newOtp = GenerateOtp();
                existingUser.VerificationOtp = newOtp;
                existingUser.OtpExpiry = DateTime.UtcNow.AddMinutes(10);
                await _context.SaveChangesAsync();
                await SendOtpSafeAsync(existingUser.Email, existingUser.Name, newOtp);

                return new AuthResponseDto
                {
                    Token = string.Empty,
                    Name = existingUser.Name,
                    Email = existingUser.Email,
                    IsEmailVerified = false,
                };
            }
            throw new InvalidOperationException("EMAIL_EXISTS");
        }

        var otp = GenerateOtp();
        var user = new User
        {
            Name = dto.Name,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            IsEmailVerified = false,
            VerificationOtp = otp,
            OtpExpiry = DateTime.UtcNow.AddMinutes(10),
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        await SendOtpSafeAsync(user.Email, user.Name, otp);

        return new AuthResponseDto
        {
            Token = string.Empty,
            Name = user.Name,
            Email = user.Email,
            IsEmailVerified = false,
        };
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user is null) return null;

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return null;

        if (!user.IsEmailVerified)
            return new AuthResponseDto
            {
                Token = string.Empty,
                Name = user.Name,
                Email = user.Email,
                IsEmailVerified = false,
            };

        return new AuthResponseDto
        {
            Token = GenerateToken(user),
            Name = user.Name,
            Email = user.Email,
            IsEmailVerified = true,
        };
    }

    public async Task<bool> VerifyOtpAsync(string email, string otp)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user is null) return false;
        if (user.IsEmailVerified) return false;
        if (user.VerificationOtp != otp) return false;
        if (user.OtpExpiry < DateTime.UtcNow) return false;

        user.IsEmailVerified = true;
        user.VerificationOtp = null;
        user.OtpExpiry = null;
        await _context.SaveChangesAsync();
        return true;
    }

    private static string GenerateOtp()
        => Random.Shared.Next(100000, 999999).ToString();

    private async Task SendOtpSafeAsync(string email, string name, string otp)
    {
        try
        {
            await _emailService.SendOtpEmailAsync(email, name, otp);
            _logger.LogInformation("OTP email sent to {Email}", email);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send OTP email to {Email}. OTP: {Otp} — use this to verify manually.", email, otp);
        }
    }

    public async Task ResendOtpAsync(string email)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null) throw new InvalidOperationException("User not found.");
        if (user.IsEmailVerified) throw new InvalidOperationException("Email already verified.");

        var otp = GenerateOtp();
        user.VerificationOtp = otp;
        user.OtpExpiry = DateTime.UtcNow.AddMinutes(10);
        await _context.SaveChangesAsync();

        await SendOtpSafeAsync(user.Email, user.Name, otp);
    }

    public async Task ForgotPasswordAsync(string email)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

        // Silently succeed even if user not found — prevents email enumeration
        if (user is null) return;

        var otp = GenerateOtp();
        user.VerificationOtp = otp;
        user.OtpExpiry = DateTime.UtcNow.AddMinutes(10);
        await _context.SaveChangesAsync();

        await SendPasswordResetOtpSafeAsync(user.Email, user.Name, otp);
    }

    public async Task<bool> ResetPasswordAsync(string email, string otp, string newPassword)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user is null) return false;
        if (user.VerificationOtp != otp) return false;
        if (user.OtpExpiry < DateTime.UtcNow) return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.VerificationOtp = null;
        user.OtpExpiry = null;
        await _context.SaveChangesAsync();

        return true;
    }

    private async Task SendPasswordResetOtpSafeAsync(string email, string name, string otp)
    {
        try
        {
            await _emailService.SendPasswordResetOtpEmailAsync(email, name, otp);
            _logger.LogInformation("Password reset OTP email sent to {Email}", email);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send password reset OTP email to {Email}. OTP: {Otp} — use this to reset manually.", email, otp);
        }
    }

    private string GenerateToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Email, user.Email),
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}