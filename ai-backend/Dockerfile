FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
USER $APP_UID
WORKDIR /app

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["junie-des-semantic-kernel/junie-des-semantic-kernel.csproj", "junie-des-semantic-kernel/"]
RUN dotnet restore "junie-des-semantic-kernel/junie-des-semantic-kernel.csproj"
COPY . .
WORKDIR "/src/junie-des-semantic-kernel"
RUN dotnet build "./junie-des-semantic-kernel.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./junie-des-semantic-kernel.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "junie-des-semantic-kernel.dll"]
