FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["FlowDesk_Backend/FlowDesk/FlowDesk.API/FlowDesk.API.csproj", "FlowDesk.API/"]
COPY ["FlowDesk_Backend/FlowDesk/FlowDesk.Core/FlowDesk.Core.csproj", "FlowDesk.Core/"]
COPY ["FlowDesk_Backend/FlowDesk/FlowDesk.Infrastructure/FlowDesk.Infrastructure.csproj", "FlowDesk.Infrastructure/"]
COPY ["FlowDesk_Backend/FlowDesk/FlowDesk.Tests/FlowDesk.Tests.csproj", "FlowDesk.Tests/"]

RUN dotnet restore "FlowDesk.API/FlowDesk.API.csproj"

COPY FlowDesk_Backend/FlowDesk/ .
RUN dotnet publish "FlowDesk.API/FlowDesk.API.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "FlowDesk.API.dll"]