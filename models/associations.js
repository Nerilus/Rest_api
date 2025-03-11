const Movie = require('./Movie');
const Actor = require('./Actor');
const User = require('./User');
const RefreshToken = require('./RefreshToken');

// Association Movie-Actor (Many-to-Many)
Movie.belongsToMany(Actor, { 
  through: 'MovieActor',
  foreignKey: 'movieId',
  otherKey: 'actorId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Actor.belongsToMany(Movie, { 
  through: 'MovieActor',
  foreignKey: 'actorId',
  otherKey: 'movieId', 
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// Association User-RefreshToken (One-to-Many)
User.hasMany(RefreshToken, {
  foreignKey: {
    name: 'UserId',
    allowNull: false
  },
  onDelete: 'CASCADE'
});

RefreshToken.belongsTo(User, {
  foreignKey: {
    name: 'UserId',
    allowNull: false
  },
  onDelete: 'CASCADE'
});

module.exports = {
  Movie,
  Actor,
  User,
  RefreshToken
}; 