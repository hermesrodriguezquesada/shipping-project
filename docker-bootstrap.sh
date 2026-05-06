#!/bin/sh

# Salir inmediatamente si un comando falla
set -e

echo "Aplicando migraciones de Prisma..."
npx prisma migrate deploy

echo "Poblando la base de datos (seeding)..."
npx prisma db seed

echo "Iniciando la aplicación NestJS..."
exec node dist/main