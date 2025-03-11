require('dotenv').config();
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const schema = require('./graphql/schema');
const { graphqlAuth } = require('./middleware/auth');
const sequelize = require('./models/index');
require('./models/associations');

// Import des routes REST
const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');
const actorRoutes = require('./routes/actors');
const morgan = require('morgan'); // Importez morgan

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());

// Routes REST API
app.use(morgan('combined')); 

app.use('/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/actors', actorRoutes);

// Middleware GraphQL avec authentification
app.use('/graphql', graphqlHTTP(async (req) => ({
  schema,
  context: await graphqlAuth(req),
  graphiql: true
})));

// Gestion des fichiers statiques pour les images
app.use('/uploads', express.static('uploads'));

// Fonction pour démarrer l'application
async function startApp() {
  try {
    // Attendre que la base de données soit prête
    await sequelize.authenticate();
    console.log('Connexion à la base de données établie avec succès.');

    // Synchroniser les modèles avec la base de données
    // force: false pour ne pas recréer les tables si elles existent déjà
    await sequelize.sync({ force: false, alter: true });
    console.log('Modèles synchronisés avec la base de données.');

    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
    });
  } catch (error) {
    console.error('Erreur lors du démarrage de l\'application:', error);
    process.exit(1);
  }
}

startApp(); 