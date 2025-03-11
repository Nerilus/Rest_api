const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mariadb',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    retry: {
      match: [
        /Deadlock/i,
        /Connection refused/i,
        /ECONNREFUSED/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ],
      max: 5
    }
  }
);

// Fonction pour tester la connexion
const testConnection = async () => {
  let retries = 5;
  while (retries > 0) {
    try {
      await sequelize.authenticate();
      console.log('Connexion à la base de données établie avec succès.');
      return true;
    } catch (error) {
      console.log(`Tentative de connexion échouée. Tentatives restantes: ${retries - 1}`);
      retries -= 1;
      if (retries === 0) {
        console.error('Impossible de se connecter à la base de données:', error);
        return false;
      }
      // Attendre 5 secondes avant la prochaine tentative
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

module.exports = sequelize;
module.exports.testConnection = testConnection; 