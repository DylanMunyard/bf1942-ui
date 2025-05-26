using System;
using System.ComponentModel;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.SemanticKernel;
using System.Collections.Concurrent;

namespace junie_des_semantic_kernel.Prometheus;

public interface IMetricsService
{
    Task<List<PrometheusValue>> AverageNumberPlayersOverLastXDays(int days);
    Task<PrometheusValue?> GetLatestPlayerCount();
}

public class HourlyAverage
{
    public int Hour { get; set; }
    public double AveragePlayerCount { get; set; }
}

public class DailyAverage
{
    public required string Day { get; set; }
    public double AveragePlayerCount { get; set; }
}

public class MetricsService : IMetricsService
{
    private readonly HttpClient _httpClient;
    private readonly ConcurrentDictionary<string, (DateTimeOffset expiration, PrometheusResponse response)> _cache;
    private readonly TimeSpan _cacheDuration;

    public MetricsService(IHttpClientFactory httpClientFactory)
    {
        _httpClient = httpClientFactory.CreateClient("prometheus");
        _cache = new ConcurrentDictionary<string, (DateTimeOffset, PrometheusResponse)>();
        _cacheDuration = TimeSpan.FromMinutes(10); // Example cache duration
    }

    public async Task<List<PrometheusValue>> AverageNumberPlayersOverLastXDays(int days = 14)
    {
        var start = DateTime.Now.AddDays(days * -1);
        var results = await QueryRangeAsync("bf1942_players_online", start, DateTime.Now, "1h");

        return results!.Data.Results.SelectMany(r => r.Values).ToList();
    }

    public async Task<PrometheusValue?> GetLatestPlayerCount()
    {
        var now = DateTime.UtcNow;
        var start = now.AddMinutes(-30); // Look back 30 minutes to ensure we get a value
        var results = await QueryRangeAsync("bf1942_players_online", start, now, "1m");
        var values = results?.Data.Results.SelectMany(r => r.Values).ToList();
        return values?.OrderByDescending(v => v.Timestamp).FirstOrDefault();
    }

    private async Task<PrometheusResponse?> QueryRangeAsync(string metricName, DateTime start, DateTime end, string step)
    {
        // Format start and end dates for Prometheus
        var formattedStart = start.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss") + "Z";
        var formattedEnd = end.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss") + "Z";

        // Build the query string
        var queryString = $"/api/v1/query_range?query={metricName}&start={formattedStart}&end={formattedEnd}&step={step}";

        // Check cache for existing response
        if (_cache.TryGetValue(queryString, out var cacheEntry) && cacheEntry.expiration > DateTimeOffset.Now)
        {
            return cacheEntry.response;
        }

        // Cache miss; make the HTTP request
        var response = await _httpClient.GetAsync(queryString);
        if (!response.IsSuccessStatusCode)
        {
            throw new ApplicationException($"Prometheus query failed with status code {response.StatusCode}");
        }

        var jsonResponse = await response.Content.ReadAsStringAsync();
        var prometheusResponse = JsonSerializer.Deserialize<PrometheusResponse>(jsonResponse);

        // Store response in cache
        _cache[queryString] = (DateTimeOffset.Now.Add(_cacheDuration), prometheusResponse)!;

        return prometheusResponse;
    }

    private async Task<PrometheusResponse?> QueryAsync(string metricName)
    {
        // Build the query string
        var queryString = $"/api/v1/query?query={metricName}";

        // Check cache for existing response
        if (_cache.TryGetValue(queryString, out var cacheEntry) && cacheEntry.expiration > DateTimeOffset.Now)
        {
            return cacheEntry.response;
        }

        // Cache miss; make the HTTP request
        var response = await _httpClient.GetAsync(queryString);
        if (!response.IsSuccessStatusCode)
        {
            throw new ApplicationException($"Prometheus query failed with status code {response.StatusCode}");
        }

        var jsonResponse = await response.Content.ReadAsStringAsync();
        var prometheusResponse = JsonSerializer.Deserialize<PrometheusResponse>(jsonResponse);

        // Store response in cache
        _cache[queryString] = (DateTimeOffset.Now.Add(_cacheDuration), prometheusResponse)!;

        return prometheusResponse;
    }
}

// Root response object
public class PrometheusResponse
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("data")]
    public PrometheusData Data { get; set; } = new PrometheusData();
}

// "data" object
public class PrometheusData
{
    [JsonPropertyName("resultType")]
    public string ResultType { get; set; } = string.Empty;

    [JsonPropertyName("result")]
    public List<PrometheusResult> Results { get; set; } = new List<PrometheusResult>();
}

// "result" object
public class PrometheusResult
{
    [JsonPropertyName("metric")]
    public Dictionary<string, string> Metric { get; set; } = new Dictionary<string, string>();

    [JsonPropertyName("values")]
    [JsonConverter(typeof(PrometheusValueListConverter))]
    public List<PrometheusValue> Values { get; set; } = [];
}

// Individual value [timestamp, value]
public class PrometheusValue
{
    public long Timestamp { get; init; }
    public double Value { get; init; }
}

// Custom converter for list of PrometheusValue
public class PrometheusValueListConverter : JsonConverter<List<PrometheusValue>>
{
    public override List<PrometheusValue> Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType != JsonTokenType.StartArray)
        {
            throw new JsonException("Expected StartArray token for Prometheus values list.");
        }

        var values = new List<PrometheusValue>();

        while (reader.Read() && reader.TokenType != JsonTokenType.EndArray)
        {
            // Read each inner array ([timestamp, value])
            if (reader.TokenType == JsonTokenType.StartArray)
            {
                reader.Read(); // Read timestamp
                var timestamp = reader.GetInt64();

                reader.Read(); // Read value
                double value;
                switch (reader.TokenType)
                {
                    case JsonTokenType.String:
                    {
                        // If the value is a string, parse it into a double
                        if (!double.TryParse(reader.GetString(), out value))
                        {
                            throw new JsonException("Expected a numeric (double) value in string format.");
                        }

                        break;
                    }
                    case JsonTokenType.Number:
                        // If the value is a number, read it directly
                        value = reader.GetDouble();
                        break;
                    default:
                        throw new JsonException("Expected a numeric or string representation of a double value.");
                }


                reader.Read(); // End of inner array
                if (reader.TokenType != JsonTokenType.EndArray)
                {
                    throw new JsonException("Expected EndArray token for value pair array.");
                }

                // Add the deserialized PrometheusValue to the list
                values.Add(new PrometheusValue
                {
                    Timestamp = timestamp,
                    Value = value
                });
            }
        }

        return values;
    }

    public override void Write(Utf8JsonWriter writer, List<PrometheusValue> value, JsonSerializerOptions options)
    {
        writer.WriteStartArray();
        foreach (var item in value)
        {
            writer.WriteStartArray();
            writer.WriteNumberValue(item.Timestamp);
            writer.WriteNumberValue(item.Value);
            writer.WriteEndArray();
        }
        writer.WriteEndArray();
    }
}