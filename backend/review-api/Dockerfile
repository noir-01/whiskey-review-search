FROM openjdk:17-jdk-slim
WORKDIR /app
COPY build/libs/review-api-0.0.2.jar /app/review-api.jar
EXPOSE 9090

# Spring Boot 애플리케이션 실행
ENTRYPOINT ["java", "-jar", "/app/review-api.jar"]