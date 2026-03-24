FROM maven:3.9.6-eclipse-temurin-21

WORKDIR /home/soriaruiz

# Copiamos todo el proyecto
COPY . .

# Exponemos el puerto típico de Spring
EXPOSE 8080

# Ejecutamos como si fuera mvn spring-boot:run
CMD ["mvn", "spring-boot:run"]

