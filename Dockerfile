# ==============================================================================
# Multi-Stage Dockerfile for PayrollPro SaaS (100% Free Cloud Deployment)
# Packages React 18 Frontend + Spring Boot Backend into a Single Optimized Image
# Compatible with Render, Koyeb, Railway, Fly.io
# ==============================================================================

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend
FROM maven:3.9.6-eclipse-temurin-17-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/pom.xml .
COPY backend/src ./src
# Copy compiled frontend dist into Spring Boot static web folder
COPY --from=frontend-builder /app/frontend/dist ./src/main/resources/static
RUN mvn clean package -DskipTests

# Stage 3: Minimal Production Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=backend-builder /app/backend/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
