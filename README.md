# Biomercados Process Api

Microservicio que alimenta la base de datos de MongoDB

# Construir Imagen 
```
docker build . -t biomercados/process-api
```

# Ejecutar Imagen 

```
docker run --name beta-process-api -p 3002:3002 biomercados/process-api
```