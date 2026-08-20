FROM maven:3.9.9-eclipse-temurin-24 AS build

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

# ===== RUN STAGE =====
# Không dùng bản -alpine: musl libc (Alpine) có lỗi resolve DNS cho hostname
# nhiều bản ghi CNAME/A/AAAA (pooler hostname của Neon) -> UnknownHostException.
FROM eclipse-temurin:24-jdk

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java","-jar","/app/app.jar"]