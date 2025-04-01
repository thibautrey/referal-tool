# Referal Tool

Application web avec une API Node.js (TypeScript) et un frontend.

## Structure

- `/backend` : API Node.js en TypeScript
- `/frontend` : Application frontend

## Installation

```bash
# Installer toutes les dépendances
npm run install-all
```

## Configuration de la base de données

Le projet utilise Prisma ORM pour gérer la base de données.

```bash
# Copier le fichier d'exemple d'environnement
cd backend
cp .env.example .env

# Configurer la base de données dans le fichier .env
# Modifier DATABASE_URL selon votre configuration

# Générer le client Prisma
npm run prisma:generate

# Exécuter les migrations
npm run prisma:migrate
```

## Démarrage

```bash
# Démarrer l'application complète (backend et frontend)
npm start

# Démarrer seulement le backend
npm run backend

# Démarrer seulement le frontend
npm run frontend
```

## Développement

```bash
# Compiler le backend TypeScript
cd backend && npm run build

# Ouvrir Prisma Studio (interface d'administration de la base de données)
cd backend && npm run prisma:studio
```
