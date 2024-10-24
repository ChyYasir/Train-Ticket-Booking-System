FROM gradle:8.10.2-jdk17 as build

WORKDIR /app

COPY . .
RUN gradle build

FROM openjdk:17-jdk-slim
COPY --from=build /app/build/libs/*.jar /app/delivery-service.jar

EXPOSE 8080
CMD ["java", "-jar", "/app/delivery-service.jar"]
