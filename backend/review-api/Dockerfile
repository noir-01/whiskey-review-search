FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app
COPY build/libs/review-api-0.0.4.jar /app/review-api.jar
EXPOSE 8080

# Spring Boot 애플리케이션 실행
ENTRYPOINT ["java", "-jar", "/app/review-api.jar"]