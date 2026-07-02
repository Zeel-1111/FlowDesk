namespace FlowDesk.Infrastructure.Services;

using System.Text.Json;
using FlowDesk.Core.Interfaces;
using StackExchange.Redis;

public class RedisCacheService : ICacheService
{
    private readonly IDatabase _db;
    private readonly string _prefix = "flowdesk:";

    public RedisCacheService(IConnectionMultiplexer redis)
    {
        _db = redis.GetDatabase();
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        try
        {
            var value = await _db.StringGetAsync($"{_prefix}{key}");
            if (value.IsNullOrEmpty) return default;
            return JsonSerializer.Deserialize<T>(value!);
        }
        catch (RedisConnectionException)
        {
            Console.WriteLine("Redis is down. Skipping cache read.");
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null)
    {
        try
        {
            var json = JsonSerializer.Serialize(value);
            await _db.StringSetAsync(
                $"{_prefix}{key}",
                json,
                expiry ?? TimeSpan.FromMinutes(5));
        }
        catch (RedisConnectionException)
        {
            Console.WriteLine("Redis is down. Skipping cache write.");
        }
    }

    public async Task RemoveAsync(string key)
    {
        try
        {
            await _db.KeyDeleteAsync($"{_prefix}{key}");
        }
        catch (RedisConnectionException)
        {
            Console.WriteLine("Redis is down. Skipping cache delete.");
        }
    }

    public async Task RemoveByPrefixAsync(string prefix)
    {
        try
        {
            var server = _db.Multiplexer.GetServer(_db.Multiplexer.GetEndPoints().First());
            var keys = server.Keys(pattern: $"{_prefix}{prefix}*").ToArray();
            if (keys.Length > 0)
                await _db.KeyDeleteAsync(keys);
        }
        catch (RedisConnectionException)
        {
            Console.WriteLine("Redis is down. Skipping cache prefix delete.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Cache prefix delete failed: {ex.Message}");
        }
    }
}