namespace FlowDesk.Tests.Auth;

using FlowDesk.Core.DTOs;
using FlowDesk.Core.Entities;
using FlowDesk.Core.Interfaces;
using FlowDesk.Infrastructure.Data;
using FlowDesk.Infrastructure.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using System;
using Microsoft.Extensions.Logging;

public class AuthServiceTests
{
    private readonly AppDbContext _context;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly Mock<ILogger<AuthService>> _loggerMock;
    private readonly IConfiguration _configuration;
    private readonly AuthService _authService;

    public AuthServiceTests()
    {
        // Use in-memory database for tests
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
        .Options;

        _context = new AppDbContext(options);
        _emailServiceMock = new Mock<IEmailService>();
        _loggerMock = new Mock<ILogger<AuthService>>();

        // Mock configuration
        var configData = new Dictionary<string, string?>
        {
            { "Jwt:Key", "TestSecretKeyForFlowDeskJWTTesting2026!!" },
            { "Jwt:Issuer", "FlowDeskAPI" },
            { "Jwt:Audience", "FlowDeskClient" },
            { "App:FrontendUrl", "http://localhost:5173" },
        };

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();

        _authService = new AuthService(_context, _configuration, _emailServiceMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task Register_WithNewEmail_ShouldCreateUser()
    {
        // Arrange
        var dto = new RegisterDto
        {
            Name = "Zeel Thakkar",
            Email = "zeel@test.com",
            Password = "Test@123"
        };

        // Act
        var result = await _authService.RegisterAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result.Email.Should().Be("zeel@test.com");
        result.IsEmailVerified.Should().BeFalse();
        result.Token.Should().BeEmpty(); // no token until verified

        var userInDb = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        userInDb.Should().NotBeNull();
        userInDb!.VerificationOtp.Should().NotBeNull();
    }

    [Fact]
    public async Task Register_WithExistingVerifiedEmail_ShouldThrowException()
    {
        // Arrange — create a verified user first
        _context.Users.Add(new User
        {
            Name = "Existing User",
            Email = "existing@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password"),
            IsEmailVerified = true,
        });
        await _context.SaveChangesAsync();

        var dto = new RegisterDto
        {
            Name = "New User",
            Email = "existing@test.com",
            Password = "Test@123"
        };

        // Act
        var act = async () => await _authService.RegisterAsync(dto);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("EMAIL_EXISTS");
    }

    [Fact]
    public async Task Register_WithExistingUnverifiedEmail_ShouldResendOtp()
    {
        // Arrange — unverified user
        _context.Users.Add(new User
        {
            Name = "Unverified User",
            Email = "unverified@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password"),
            IsEmailVerified = false,
            VerificationOtp = "123456",
            OtpExpiry = DateTime.UtcNow.AddMinutes(5),
        });
        await _context.SaveChangesAsync();

        var dto = new RegisterDto
        {
            Name = "Unverified User",
            Email = "unverified@test.com",
            Password = "password"
        };

        // Act
        var result = await _authService.RegisterAsync(dto);

        // Assert
        result.IsEmailVerified.Should().BeFalse();

        var user = await _context.Users.FirstAsync(u => u.Email == dto.Email);
        user.VerificationOtp.Should().NotBe("123456"); // new OTP generated
    }

    [Fact]
    public async Task Login_WithValidCredentials_ShouldReturnToken()
    {
        // Arrange
        _context.Users.Add(new User
        {
            Name = "Test User",
            Email = "login@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test@123"),
            IsEmailVerified = true,
        });
        await _context.SaveChangesAsync();

        var dto = new LoginDto { Email = "login@test.com", Password = "Test@123" };

        // Act
        var result = await _authService.LoginAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result!.Token.Should().NotBeEmpty();
        result.IsEmailVerified.Should().BeTrue();
    }

    [Fact]
    public async Task Login_WithWrongPassword_ShouldReturnNull()
    {
        // Arrange
        _context.Users.Add(new User
        {
            Name = "Test User",
            Email = "wrong@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("CorrectPassword"),
            IsEmailVerified = true,
        });
        await _context.SaveChangesAsync();

        var dto = new LoginDto { Email = "wrong@test.com", Password = "WrongPassword" };

        // Act
        var result = await _authService.LoginAsync(dto);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task Login_WithUnverifiedEmail_ShouldReturnEmptyToken()
    {
        // Arrange
        _context.Users.Add(new User
        {
            Name = "Unverified",
            Email = "unverified2@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test@123"),
            IsEmailVerified = false,
        });
        await _context.SaveChangesAsync();

        var dto = new LoginDto { Email = "unverified2@test.com", Password = "Test@123" };

        // Act
        var result = await _authService.LoginAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result!.Token.Should().BeEmpty();
        result.IsEmailVerified.Should().BeFalse();
    }

    [Fact]
    public async Task VerifyOtp_WithValidOtp_ShouldVerifyEmail()
    {
        // Arrange
        _context.Users.Add(new User
        {
            Name = "OTP User",
            Email = "otp@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password"),
            IsEmailVerified = false,
            VerificationOtp = "654321",
            OtpExpiry = DateTime.UtcNow.AddMinutes(10),
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.VerifyOtpAsync("otp@test.com", "654321");

        // Assert
        result.Should().BeTrue();

        var user = await _context.Users.FirstAsync(u => u.Email == "otp@test.com");
        user.IsEmailVerified.Should().BeTrue();
        user.VerificationOtp.Should().BeNull();
        user.OtpExpiry.Should().BeNull();
    }

    [Fact]
    public async Task VerifyOtp_WithExpiredOtp_ShouldReturnFalse()
    {
        // Arrange
        _context.Users.Add(new User
        {
            Name = "Expired OTP User",
            Email = "expired@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password"),
            IsEmailVerified = false,
            VerificationOtp = "999999",
            OtpExpiry = DateTime.UtcNow.AddMinutes(-5), // expired
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.VerifyOtpAsync("expired@test.com", "999999");

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task VerifyOtp_WithWrongOtp_ShouldReturnFalse()
    {
        // Arrange
        _context.Users.Add(new User
        {
            Name = "Wrong OTP User",
            Email = "wrongotp@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password"),
            IsEmailVerified = false,
            VerificationOtp = "111111",
            OtpExpiry = DateTime.UtcNow.AddMinutes(10),
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.VerifyOtpAsync("wrongotp@test.com", "999999");

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task ResetPassword_WithValidOtp_ShouldUpdatePassword()
    {
        // Arrange
        var oldHash = BCrypt.Net.BCrypt.HashPassword("OldPassword");
        _context.Users.Add(new User
        {
            Name = "Reset User",
            Email = "reset@test.com",
            PasswordHash = oldHash,
            IsEmailVerified = true,
            VerificationOtp = "777777",
            OtpExpiry = DateTime.UtcNow.AddMinutes(10),
        });
        await _context.SaveChangesAsync();

        var dto = new ResetPasswordDto
        {
            Email = "reset@test.com",
            Otp = "777777",
            NewPassword = "NewPassword@123"
        };

        // Act
        var result = await _authService.ResetPasswordAsync(dto.Email, dto.Otp, dto.NewPassword);

        // Assert
        result.Should().BeTrue();

        var user = await _context.Users.FirstAsync(u => u.Email == "reset@test.com");
        BCrypt.Net.BCrypt.Verify("NewPassword@123", user.PasswordHash).Should().BeTrue();
        user.VerificationOtp.Should().BeNull();
    }
}