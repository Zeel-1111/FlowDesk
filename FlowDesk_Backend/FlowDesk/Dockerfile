FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["FlowDesk.API/FlowDesk.API.csproj", "FlowDesk.API/"]
COPY ["FlowDesk.Core/FlowDesk.Core.csproj", "FlowDesk.Core/"]
COPY ["FlowDesk.Infrastructure/FlowDesk.Infrastructure.csproj", "FlowDesk.Infrastructure/"]
COPY ["FlowDesk.Tests/FlowDesk.Tests.csproj", "FlowDesk.Tests/"]

RUN dotnet restore "FlowDesk.API/FlowDesk.API.csproj"

COPY . .
RUN dotnet publish "FlowDesk.API/FlowDesk.API.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "FlowDesk.API.dll"]