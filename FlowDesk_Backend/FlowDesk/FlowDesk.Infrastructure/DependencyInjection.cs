namespace FlowDesk.Infrastructure;

using FlowDesk.Core.Interfaces;
using FlowDesk.Infrastructure.Data;
using FlowDesk.Infrastructure.Repositories;
using FlowDesk.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        // Redis
        //var redisConnection = configuration.GetConnectionString("Redis") ?? "localhost:6379";
        //var options = ConfigurationOptions.Parse(redisConnection);
        //options.AbortOnConnectFail = false;

        var redisConnection = configuration.GetConnectionString("Redis") ?? "localhost:6379";
        var configOptions = ConfigurationOptions.Parse(redisConnection);
        configOptions.AbortOnConnectFail = false; // don't crash if Redis is down
        configOptions.Ssl = redisConnection.StartsWith("rediss://");

        services.AddSingleton<IConnectionMultiplexer>(
            ConnectionMultiplexer.Connect(configOptions));
        services.AddSingleton<ICacheService, RedisCacheService>();

        services.AddScoped<ITaskRepository, TaskRepository>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IEmailService, SmtpEmailService>();
        services.AddHttpClient<IAITaskService, GeminiTaskService>();

        return services;
    }
}