# Build stage
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar
RUN mkdir -p /app/data
EXPOSE 8081
ENV PORT=8081
ENTRYPOINT ["java", "-Dserver.port=${PORT}", "-jar", "app.jar"]
