const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Movie = sequelize.define('Movie', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  director: {
    type: DataTypes.STRING,
    allowNull: false
  },
  releaseYear: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1888,
      max: new Date().getFullYear()
    }
  },
  genre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rating: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0,
      max: 10
    }
  },
  available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  rentalPrice: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  coverImage: {
    type: DataTypes.STRING
  }
});

module.exports = Movie; 