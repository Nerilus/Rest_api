# Utiliser une image de base officielle Node.js avec Alpine (plus légère)
FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Créer le répertoire node_modules avec les bonnes permissions
RUN mkdir -p node_modules && chown -R node:node /app

# Changer l'utilisateur pour node
USER node

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers du projet
COPY --chown=node:node . .

# Exposer le port
EXPOSE 3000

# Démarrer l'application
CMD ["npm", "start"]