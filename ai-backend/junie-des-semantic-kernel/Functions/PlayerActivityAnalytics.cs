using System.ComponentModel;
using junie_des_semantic_kernel.Prometheus;
using Microsoft.SemanticKernel;

namespace junie_des_semantic_kernel.Functions;

public class PlayerActivityAnalytics
{
    private readonly IMetricsService _metricsService;
    private int _timezoneOffsetHours = 0;

    public PlayerActivityAnalytics(IMetricsService metricsService, IConfiguration configuration)
    {
        _metricsService = metricsService;
        _timezoneOffsetHours = int.Parse(configuration["TimeZoneOffsetHours"] ?? "0");
    }
    
    [KernelFunction("get_busiest_hour_of_day")]
    [Description("Returns the hour of day with the highest average player count across all days in local timezone, optionally within a given hour range.")]
    public async Task<BusiestHourResult> GetBusiestHourOfDay(
        int days = 14,
        [Description("Optional timezone offset in hours from UTC")] 
        int? timezoneOffset = null,
        [Description("Optional start hour (0-23) in local time to filter results, inclusive.")]
        int? startHour = null,
        [Description("Optional end hour (0-23) in local time to filter results, inclusive.")]
        int? endHour = null)
    {
        // Use provided timezone offset or default
        var offset = timezoneOffset ?? _timezoneOffsetHours;
        var rawData = await _metricsService.AverageNumberPlayersOverLastXDays(days);

        // Filter by hour range if provided
        if (startHour.HasValue && endHour.HasValue)
        {
            rawData = rawData
                .Where(v => {
                    var hour = TimeHelper.ConvertToLocalHour(v.Timestamp, offset);
                    // Handles wrap-around (e.g., 22 to 2)
                    if (startHour <= endHour)
                        return hour >= startHour && hour <= endHour;
                    else
                        return hour >= startHour || hour <= endHour;
                })
                .ToList();
        }

        var hourlyAverages = rawData
            .GroupBy(v => TimeHelper.ConvertToLocalHour(v.Timestamp, offset))
            .Select(g => new HourlyAverage {
                Hour = g.Key,
                AveragePlayerCount = Math.Round(g.Average(v => v.Value), 1),
                SampleCount = g.Count()
            })
            .OrderByDescending(h => h.AveragePlayerCount)
            .ToList();

        return new BusiestHourResult {
            BusiestHour = hourlyAverages.FirstOrDefault(),
            TopHours = hourlyAverages.Take(3).ToList(),
            AnalyzedDays = days
        };
    }
    
    [KernelFunction("get_busiest_hours_by_day_of_week")]
    [Description("Returns the busiest hours for a specific day of the week (Monday=1, Sunday=7) in local timezone, optionally within a given hour range.")]
    public async Task<DayOfWeekActivityResult> GetBusiestHoursByDayOfWeek(
        [Description("Day of week as a number (1=Monday, 7=Sunday)")]
        int dayOfWeek, 
        int days = 14,
        [Description("Optional timezone offset in hours from UTC")] 
        int? timezoneOffset = null,
        [Description("Optional start hour (0-23) in local time to filter results, inclusive.")]
        int? startHour = null,
        [Description("Optional end hour (0-23) in local time to filter results, inclusive.")]
        int? endHour = null)
    {
        var offset = timezoneOffset ?? _timezoneOffsetHours;
        var rawData = await _metricsService.AverageNumberPlayersOverLastXDays(days);

        // Filter to only the requested day of week
        var dayData = rawData
            .Where(v => {
                var date = TimeHelper.ConvertToUtcWithOffset(v.Timestamp, offset);
                var dow = ((int)date.DayOfWeek + 6) % 7 + 1;
                return dow == dayOfWeek;
            })
            .ToList();

        // Filter by hour range if provided
        if (startHour.HasValue && endHour.HasValue)
        {
            dayData = dayData
                .Where(v => {
                    var hour = TimeHelper.ConvertToLocalHour(v.Timestamp, offset);
                    // Handles wrap-around (e.g., 22 to 2)
                    if (startHour <= endHour)
                        return hour >= startHour && hour <= endHour;
                    else
                        return hour >= startHour || hour <= endHour;
                })
                .ToList();
        }

        var hourlyAverages = dayData
            .GroupBy(v => TimeHelper.ConvertToLocalHour(v.Timestamp, offset))
            .Select(g => new HourlyAverage {
                Hour = g.Key,
                AveragePlayerCount = Math.Round(g.Average(v => v.Value), 1),
                SampleCount = g.Count()
            })
            .OrderByDescending(h => h.AveragePlayerCount)
            .ToList();

        string dayName = dayOfWeek switch {
            1 => "Monday",
            2 => "Tuesday",
            3 => "Wednesday",
            4 => "Thursday",
            5 => "Friday",
            6 => "Saturday",
            7 => "Sunday",
            _ => "Unknown"
        };

        return new DayOfWeekActivityResult {
            DayOfWeek = dayOfWeek,
            DayName = dayName,
            BusiestHours = hourlyAverages.Take(5).ToList(),
            SampleCount = dayData.Count > 0 ? dayData.Count / 24 : 0,
            AnalyzedDays = days
        };
    }
    
    [KernelFunction("get_weekend_activity_profile")]
    [Description("Compares player activity between weekends (Saturday/Sunday) and weekdays in local timezone.")]
    public async Task<WeekendActivityResult> GetWeekendActivityProfile(
        int days = 14,
        [Description("Optional timezone offset in hours from UTC")] 
        int? timezoneOffset = null)
    {
        // Use provided timezone offset or default
        var offset = timezoneOffset ?? _timezoneOffsetHours;
        var rawData = await _metricsService.AverageNumberPlayersOverLastXDays(days);
        
        var weekendData = rawData
            .Where(v => {
                var date = TimeHelper.ConvertToUtcWithOffset(v.Timestamp, offset);
                return date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;
            });
            
        var weekdayData = rawData
            .Where(v => {
                var date = TimeHelper.ConvertToUtcWithOffset(v.Timestamp, offset);
                return date.DayOfWeek != DayOfWeek.Saturday && date.DayOfWeek != DayOfWeek.Sunday;
            });
            
        // Get busiest hours for weekend
        var weekendHourly = weekendData
            .GroupBy(v => TimeHelper.ConvertToLocalHour(v.Timestamp, offset))
            .Select(g => new HourlyAverage {
                Hour = g.Key,
                AveragePlayerCount = Math.Round(g.Average(v => v.Value), 1),
                SampleCount = g.Count()
            })
            .OrderByDescending(h => h.AveragePlayerCount)
            .Take(5)
            .ToList();
            
        // Get weekend vs weekday comparison
        double weekendAvg = weekendData.Average(v => v.Value);
        double weekdayAvg = weekdayData.Average(v => v.Value);
        double percentDifference = Math.Round(((weekendAvg / weekdayAvg) - 1) * 100, 1);
        
        return new WeekendActivityResult {
            WeekendBusiestHours = weekendHourly,
            WeekendAveragePlayerCount = Math.Round(weekendAvg, 1),
            WeekdayAveragePlayerCount = Math.Round(weekdayAvg, 1),
            PercentDifference = percentDifference,
            AnalyzedDays = days
        };
    }
    
    [KernelFunction("get_day_over_day_pattern")]
    [Description("Provides a daily pattern of player counts to identify trends across the week in local timezone.")]
    public async Task<WeeklyPatternResult> GetDayOverDayPattern(
        int days = 14,
        [Description("Optional timezone offset in hours from UTC")] 
        int? timezoneOffset = null)
    {
        // Use provided timezone offset or default
        var offset = timezoneOffset ?? _timezoneOffsetHours;
        var rawData = await _metricsService.AverageNumberPlayersOverLastXDays(days);
        
        // Group by day of week and get averages
        var dayOfWeekAverages = rawData
            .GroupBy(v => {
                var date = TimeHelper.ConvertToUtcWithOffset(v.Timestamp, offset);
                return (int)date.DayOfWeek;
            })
            .Select(g => new DayAverage {
                DayOfWeek = g.Key,
                DayName = ((DayOfWeek)g.Key).ToString(),
                AveragePlayerCount = Math.Round(g.Average(v => v.Value), 1),
                PeakHour = g
                    .GroupBy(v => TimeHelper.ConvertToLocalHour(v.Timestamp, offset))
                    .OrderByDescending(hg => hg.Average(v => v.Value))
                    .First()
                    .Key
            })
            .OrderBy(d => d.DayOfWeek)
            .ToList();
            
        // Find the busiest day
        var busiest = dayOfWeekAverages.OrderByDescending(d => d.AveragePlayerCount).First();
        
        return new WeeklyPatternResult {
            DailyAverages = dayOfWeekAverages,
            BusiestDay = busiest,
            AnalyzedDays = days
        };
    }
    
    [KernelFunction("get_average_players_for_hours")]
    [Description("Returns the average player count for a list of hours (0-23) across all days or for a specific day of week in local timezone.")]
    public async Task<AveragePlayersForHoursResult> GetAveragePlayersForHours(
        [Description("List of hours (0-23) to get averages for, e.g. [9,10,11]")] 
        List<int> hours,
        int days = 14,
        [Description("Optional day of week as a number (1=Monday, 7=Sunday). If omitted, averages across all days.")]
        int? dayOfWeek = null,
        [Description("Optional timezone offset in hours from UTC")] 
        int? timezoneOffset = null)
    {
        var offset = timezoneOffset ?? _timezoneOffsetHours;
        var rawData = await _metricsService.AverageNumberPlayersOverLastXDays(days);

        // Optionally filter by day of week
        if (dayOfWeek.HasValue)
        {
            rawData = rawData
                .Where(v => {
                    var date = TimeHelper.ConvertToUtcWithOffset(v.Timestamp, offset);
                    var dow = ((int)date.DayOfWeek + 6) % 7 + 1;
                    return dow == dayOfWeek.Value;
                })
                .ToList();
        }

        var hourAverages = hours
            .Select(h => {
                var values = rawData.Where(v => TimeHelper.ConvertToLocalHour(v.Timestamp, offset) == h).ToList();
                return new HourlyAverage {
                    Hour = h,
                    AveragePlayerCount = values.Count > 0 ? Math.Round(values.Average(v => v.Value), 1) : 0,
                    SampleCount = values.Count
                };
            })
            .ToList();

        return new AveragePlayersForHoursResult {
            Hours = hourAverages,
            DayOfWeek = dayOfWeek,
            AnalyzedDays = days
        };
    }
    
    [KernelFunction("get_current_player_count")]
    [Description("Returns the most recent player count from the bf1942_players_online metric.")]
    public async Task<CurrentPlayerCountResult> GetCurrentPlayerCount()
    {
        var latest = await _metricsService.GetLatestPlayerCount();
        if (latest == null)
        {
            return new CurrentPlayerCountResult
            {
                Timestamp = null,
                PlayerCount = null,
                Message = "No recent player count available."
            };
        }

        var dt = DateTimeOffset.FromUnixTimeSeconds(latest.Timestamp).ToLocalTime();

        return new CurrentPlayerCountResult
        {
            Timestamp = dt,
            PlayerCount = (int)Math.Round(latest.Value),
            Message = $"There are {latest.Value:0} players online (as of {dt:yyyy-MM-dd HH:mm})"
        };
    }
}

public class CurrentPlayerCountResult
{
    public DateTimeOffset? Timestamp { get; set; }
    public int? PlayerCount { get; set; }
    public string Message { get; set; } = "";
}

// Result classes for structured output
public class HourlyAverage
{
    public int Hour { get; set; }
    public double AveragePlayerCount { get; set; }
    public int SampleCount { get; set; }
}

public class DayAverage
{
    public int DayOfWeek { get; set; }
    public string DayName { get; set; }
    public double AveragePlayerCount { get; set; }
    public int PeakHour { get; set; }
    
    public string PeakTimeFormatted => $"{PeakHour:D2}:00";
}

public class BusiestHourResult
{
    public HourlyAverage? BusiestHour { get; set; }
    public List<HourlyAverage> TopHours { get; set; }
    public int AnalyzedDays { get; set; }
}

public class DayOfWeekActivityResult
{
    public int DayOfWeek { get; set; }
    public string DayName { get; set; }
    public List<HourlyAverage> BusiestHours { get; set; } = [];
    public int SampleCount { get; set; }
    public int AnalyzedDays { get; set; }
}

public class WeekendActivityResult
{
    public List<HourlyAverage> WeekendBusiestHours { get; set; } = [];
    public double WeekendAveragePlayerCount { get; set; }
    public double WeekdayAveragePlayerCount { get; set; }
    public double PercentDifference { get; set; }
    public int AnalyzedDays { get; set; }
}

public class WeeklyPatternResult
{
    public List<DayAverage> DailyAverages { get; set; } = [];
    public DayAverage BusiestDay { get; set; }
    public int AnalyzedDays { get; set; }
}

public class AveragePlayersForHoursResult
{
    public List<HourlyAverage> Hours { get; set; } = [];
    public int? DayOfWeek { get; set; }
    public int AnalyzedDays { get; set; }
}

public static class TimeHelper
{
    /// <summary>
    /// Converts a UTC Unix timestamp to a local hour based on the provided timezone offset.
    /// </summary>
    /// <param name="unixTimestamp">The UTC Unix timestamp.</param>
    /// <param name="offsetInHours">The timezone offset in hours.</param>
    /// <returns>The local hour (0-23).</returns>
    public static int ConvertToLocalHour(long unixTimestamp, int offsetInHours)
    {
        // Convert Unix timestamp to UTC time
        var utcTime = DateTimeOffset.FromUnixTimeSeconds(unixTimestamp);

        // Apply offset and ensure the hour is valid (0-23)
        var localHour = (utcTime.Hour + offsetInHours + 24) % 24;

        return localHour;
    }

    /// <summary>
    /// Converts a UTC Unix timestamp to the corresponding local DateTimeOffset based on timezone offset.
    /// </summary>
    /// <param name="unixTimestamp">The UTC Unix timestamp.</param>
    /// <param name="offsetInHours">The timezone offset in hours.</param>
    /// <returns>The local DateTimeOffset with the offset applied.</returns>
    public static DateTimeOffset ConvertToUtcWithOffset(long unixTimestamp, int offsetInHours)
    {
        // Convert Unix timestamp to UTC time
        var utcTime = DateTimeOffset.FromUnixTimeSeconds(unixTimestamp);

        // Apply the timezone offset
        return utcTime.ToOffset(TimeSpan.FromHours(offsetInHours));
    }
}
