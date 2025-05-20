using Microsoft.SemanticKernel;
using System.Text.Json;
using junie_des_semantic_kernel.Functions;
using junie_des_semantic_kernel.Prometheus;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;

var builder = WebApplication.CreateBuilder(args);

// Add Semantic Kernel
builder.Services.AddSingleton(sp =>
{
    // Get configuration
    var configuration = sp.GetRequiredService<IConfiguration>();
    
    // Create and configure the kernel
    var kernel = Kernel.CreateBuilder();
    
    // Configure AI service (example with OpenAI)
    kernel.AddOpenAIChatCompletion(
        modelId: configuration["OpenAI:ModelId"] ?? "gpt-4o-mini",
        apiKey: configuration["OpenAI:Key"] ?? throw new InvalidOperationException("OpenAI API key not found"),
        serviceId: "openai"
    );
    
    // Add any plugins or other configurations
    var metricsService = sp.GetRequiredService<PlayerActivityAnalytics>();
    kernel.Plugins.AddFromObject(metricsService, "Metrics");
    
    return kernel.Build();
});

builder.Services.AddHttpClient("prometheus", client =>
{
    // Get configuration
    var prometheusUrl = builder.Configuration["Prometheus:Url"]
                        ?? throw new InvalidOperationException("Prometheus URL not defined in configuration.");
    
    client.BaseAddress = new Uri(prometheusUrl); // Update to your Prometheus URL
});

builder.Services.AddSingleton<IMetricsService, MetricsService>();
builder.Services.AddSingleton<PlayerActivityAnalytics>();

var app = builder.Build();

app.MapGet("/ai/query", async (HttpContext context) =>
{
    var ms = context.RequestServices.GetRequiredService<PlayerActivityAnalytics>();

    var getBusiestHourOfDay = await ms.GetBusiestHourOfDay();
    var getBusiestHoursByDayOfWeek = await ms.GetBusiestHoursByDayOfWeek(6, 14);
    var getWeekendActivityProfile = await ms.GetWeekendActivityProfile();
    var getDayOverDayPattern = await ms.GetDayOverDayPattern();
    
    return Results.Ok(new
    {
        BusiestHourOfDay = getBusiestHourOfDay,
        BusiestHoursByDayOfWeek = getBusiestHoursByDayOfWeek,
        WeekendActivityProfile = getWeekendActivityProfile,
        DayOverDayPattern = getDayOverDayPattern,
    });
});

app.MapPost("/ai/query", async (HttpContext context) =>
{
    var kernel = context.RequestServices.GetRequiredService<Kernel>();

    var request = await JsonSerializer.DeserializeAsync<QueryRequest>(context.Request.Body);
    
    if (request?.Question is null)
        return Results.BadRequest("No question provided.");
    
    var chatService = kernel.GetRequiredService<IChatCompletionService>();

    var history = new ChatHistory();
    history.AddUserMessage(request.Question);
    var result = await chatService.GetChatMessageContentAsync(
        history,
        executionSettings: new OpenAIPromptExecutionSettings
        {
            ChatSystemPrompt = """
                               You are analyzing Battlefield 1942 player statistics.
                               - All times are adjusted to AEST (UTC+10) timezone
                               - Times shown as HH:00 format (e.g., 14:00 for 2:00 PM)
                               - Use the specialized player analytics functions when answering questions about player activity
                               - Be direct and concise - focus on the specific insights from the data
                               - Keep responses under 3 sentences for simple queries
                               - When appropriate, include that times are in AEST for clarity
                               - Remember to interpret player activity patterns in the context of AEST timezone
                               """,
            Temperature = 0.1,           // Lower temperature = more focused responses
            MaxTokens = 150,             // Limit response length
            TopP = 0.5,                  // More focused token selection
            FrequencyPenalty = 0,        // Don't penalize repetition (for conciseness)
            PresencePenalty = 0,         // Don't force diverse topics
            FunctionChoiceBehavior = FunctionChoiceBehavior.Auto()
        },
        kernel: kernel);

    /* another way:

    // Create arguments
    var arguments = new KernelArguments();

    // Create OpenAI execution settings to allow function calling
    var openAiExecutionSettings = new OpenAIPromptExecutionSettings
    {
        FunctionChoiceBehavior = FunctionChoiceBehavior.Auto()
    };

    // Create a dictionary for the execution settings
    // Use the service ID you used when registering OpenAI with the kernel
    var executionSettings = new Dictionary<string, PromptExecutionSettings>
    {
        { "openai", openAiExecutionSettings }
    };

    // Assign the dictionary to ExecutionSettings
    arguments.ExecutionSettings = executionSettings;

    var result = await kernel.InvokePromptAsync(request.Question, arguments);
    */
    // 

    return Results.Ok(new { Response = result.Content ?? string.Empty });
});

app.Run();

internal record QueryRequest(string Question);