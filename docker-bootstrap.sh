#!/bin/sh

# Salir inmediatamente si un comando falla
set -e

echo "Aplicando migraciones de Prisma..."
DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy

#echo "Poblando la base de datos (seeding)..."
#Desactivado para producción. Si necesitas hacer seed, hazlo manualmente con el siguiente comando: docker-compose exec backend node dist/src/prisma/seed.js
#DATABASE_URL="$DATABASE_URL" npx prisma db seed

echo "Iniciando la aplicación NestJS..."
exec node dist/src/main