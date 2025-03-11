const { 
  GraphQLObjectType, 
  GraphQLString, 
  GraphQLInt, 
  GraphQLFloat, 
  GraphQLBoolean, 
  GraphQLList, 
  GraphQLSchema,
  GraphQLID,
  GraphQLNonNull,
  GraphQLInputObjectType
} = require('graphql');

const { Movie, Actor, User, RefreshToken } = require('../models/associations');
const { generateTokens, refreshAccessToken, revokeAllUserTokens, ROLE_PERMISSIONS } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

// Type User
const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: GraphQLID },
    email: { type: GraphQLString },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    role: { type: GraphQLString }
  })
});

// Type Auth Response
const AuthResponseType = new GraphQLObjectType({
  name: 'AuthResponse',
  fields: {
    user: { type: UserType },
    accessToken: { type: GraphQLString },
    refreshToken: { type: GraphQLString }
  }
});

// Type Actor
const ActorType = new GraphQLObjectType({
  name: 'Actor',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    birthDate: { type: GraphQLString },
    nationality: { type: GraphQLString },
    biography: { type: GraphQLString },
    movies: {
      type: new GraphQLList(MovieType),
      resolve(parent) {
        return parent.getMovies();
      }
    }
  })
});

// Type Movie
const MovieType = new GraphQLObjectType({
  name: 'Movie',
  fields: () => ({
    id: { type: GraphQLID },
    title: { type: GraphQLString },
    director: { type: GraphQLString },
    releaseYear: { type: GraphQLInt },
    genre: { type: GraphQLString },
    rating: { type: GraphQLFloat },
    available: { type: GraphQLBoolean },
    rentalPrice: { type: GraphQLFloat },
    coverImage: { type: GraphQLString },
    actors: {
      type: new GraphQLList(ActorType),
      resolve(parent) {
        return parent.getActors();
      }
    }
  })
});

// Type Pagination
const PaginationType = new GraphQLObjectType({
  name: 'Pagination',
  fields: {
    currentPage: { type: GraphQLInt },
    totalPages: { type: GraphQLInt },
    totalItems: { type: GraphQLInt },
    itemsPerPage: { type: GraphQLInt },
    hasNextPage: { type: GraphQLBoolean },
    hasPrevPage: { type: GraphQLBoolean }
  }
});

// Type PaginatedMovies
const PaginatedMoviesType = new GraphQLObjectType({
  name: 'PaginatedMovies',
  fields: {
    movies: { type: new GraphQLList(MovieType) },
    pagination: { type: PaginationType }
  }
});

// Type PaginatedActors
const PaginatedActorsType = new GraphQLObjectType({
  name: 'PaginatedActors',
  fields: {
    actors: { type: new GraphQLList(ActorType) },
    pagination: { type: PaginationType }
  }
});

// Input Types
const RegisterInput = new GraphQLInputObjectType({
  name: 'RegisterInput',
  fields: {
    email: { type: new GraphQLNonNull(GraphQLString) },
    password: { type: new GraphQLNonNull(GraphQLString) },
    firstName: { type: new GraphQLNonNull(GraphQLString) },
    lastName: { type: new GraphQLNonNull(GraphQLString) }
  }
});

const LoginInput = new GraphQLInputObjectType({
  name: 'LoginInput',
  fields: {
    email: { type: new GraphQLNonNull(GraphQLString) },
    password: { type: new GraphQLNonNull(GraphQLString) }
  }
});

// Vérifier les permissions dans GraphQL
const checkPermission = (context, permission) => {
  if (!context.user || !context.permissions || !context.permissions.includes(permission)) {
    throw new Error(`Permission refusée: ${permission}`);
  }
};

// Queries
const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    movie: {
      type: MovieType,
      args: { id: { type: GraphQLID } },
      async resolve(parent, args, context) {
        checkPermission(context, 'read:movies');
        return Movie.findByPk(args.id, {
          include: [{ model: Actor }]
        });
      }
    },
    movies: {
      type: PaginatedMoviesType,
      args: {
        page: { type: GraphQLInt },
        limit: { type: GraphQLInt }
      },
      async resolve(parent, args, context) {
        checkPermission(context, 'read:movies');
        const page = args.page || 1;
        const limit = args.limit || 10;
        const offset = (page - 1) * limit;

        const { count, rows: movies } = await Movie.findAndCountAll({
          include: [{ 
            model: Actor,
            through: { attributes: [] }
          }],
          offset,
          limit,
          order: [['createdAt', 'DESC']]
        });

        const totalPages = Math.ceil(count / limit);

        return {
          movies,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: count,
            itemsPerPage: limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        };
      }
    },
    me: {
      type: UserType,
      resolve(parent, args, context) {
        if (!context.user) {
          throw new Error('Non authentifié');
        }
        return context.user;
      }
    },
    actor: {
      type: ActorType,
      args: { id: { type: GraphQLID } },
      async resolve(parent, args, context) {
        checkPermission(context, 'read:actors');
        return Actor.findByPk(args.id, {
          include: [{ model: Movie }]
        });
      }
    },
    actors: {
      type: PaginatedActorsType,
      args: {
        page: { type: GraphQLInt },
        limit: { type: GraphQLInt }
      },
      async resolve(parent, args, context) {
        checkPermission(context, 'read:actors');
        const page = args.page || 1;
        const limit = args.limit || 10;
        const offset = (page - 1) * limit;

        const { count, rows: actors } = await Actor.findAndCountAll({
          include: [{ 
            model: Movie,
            through: { attributes: [] }
          }],
          offset,
          limit,
          order: [['name', 'ASC']]
        });

        const totalPages = Math.ceil(count / limit);

        return {
          actors,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: count,
            itemsPerPage: limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        };
      }
    }
  }
});

// Mutations
const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    // Auth mutations
    register: {
      type: AuthResponseType,
      args: {
        input: { type: new GraphQLNonNull(RegisterInput) }
      },
      async resolve(parent, { input }) {
        const existingUser = await User.findOne({
          where: { email: input.email }
        });

        if (existingUser) {
          throw new Error('Cet email est déjà utilisé');
        }

        const hashedPassword = await bcrypt.hash(input.password, 10);
        const user = await User.create({
          ...input,
          password: hashedPassword,
          role: 'user'
        });

        const tokens = await generateTokens(user);
        return {
          user,
          ...tokens
        };
      }
    },
    login: {
      type: AuthResponseType,
      args: {
        input: { type: new GraphQLNonNull(LoginInput) }
      },
      async resolve(parent, { input }) {
        const user = await User.findOne({
          where: { email: input.email }
        });

        if (!user) {
          throw new Error('Email ou mot de passe incorrect');
        }

        const isMatch = await user.comparePassword(input.password);
        if (!isMatch) {
          throw new Error('Email ou mot de passe incorrect');
        }

        await revokeAllUserTokens(user.id);
        const tokens = await generateTokens(user);
        return {
          user,
          ...tokens
        };
      }
    },
    logout: {
      type: GraphQLBoolean,
      async resolve(parent, args, context) {
        if (!context.user) {
          throw new Error('Non authentifié');
        }
        await revokeAllUserTokens(context.user.id);
        return true;
      }
    },
    refreshToken: {
      type: AuthResponseType,
      args: {
        refreshToken: { type: new GraphQLNonNull(GraphQLString) }
      },
      async resolve(parent, args) {
        return refreshAccessToken(args.refreshToken);
      }
    },
    // Movie mutations
    addMovie: {
      type: MovieType,
      args: {
        title: { type: new GraphQLNonNull(GraphQLString) },
        director: { type: new GraphQLNonNull(GraphQLString) },
        releaseYear: { type: new GraphQLNonNull(GraphQLInt) },
        genre: { type: new GraphQLNonNull(GraphQLString) },
        rating: { type: new GraphQLNonNull(GraphQLFloat) },
        rentalPrice: { type: new GraphQLNonNull(GraphQLFloat) },
        available: { type: GraphQLBoolean }
      },
      async resolve(parent, args, context) {
        checkPermission(context, 'create:movies');
        return Movie.create(args);
      }
    },
    updateMovie: {
      type: MovieType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        title: { type: GraphQLString },
        director: { type: GraphQLString },
        releaseYear: { type: GraphQLInt },
        genre: { type: GraphQLString },
        rating: { type: GraphQLFloat },
        rentalPrice: { type: GraphQLFloat },
        available: { type: GraphQLBoolean }
      },
      async resolve(parent, args, context) {
        checkPermission(context, 'update:movies');
        const movie = await Movie.findByPk(args.id);
        if (!movie) {
          throw new Error('Film non trouvé');
        }
        await movie.update(args);
        return movie;
      }
    },
    deleteMovie: {
      type: MovieType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) }
      },
      async resolve(parent, args, context) {
        checkPermission(context, 'delete:movies');
        const movie = await Movie.findByPk(args.id);
        if (!movie) {
          throw new Error('Film non trouvé');
        }
        await movie.destroy();
        return movie;
      }
    },
    // Actor mutations
    addActor: {
      type: ActorType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        birthDate: { type: new GraphQLNonNull(GraphQLString) },
        nationality: { type: new GraphQLNonNull(GraphQLString) },
        biography: { type: new GraphQLNonNull(GraphQLString) }
      },
      async resolve(parent, args, context) {
        checkPermission(context, 'create:actors');
        return Actor.create(args);
      }
    },
    updateActor: {
      type: ActorType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        name: { type: GraphQLString },
        birthDate: { type: GraphQLString },
        nationality: { type: GraphQLString },
        biography: { type: GraphQLString }
      },
      async resolve(parent, args, context) {
        checkPermission(context, 'update:actors');
        const actor = await Actor.findByPk(args.id);
        if (!actor) {
          throw new Error('Acteur non trouvé');
        }
        await actor.update(args);
        return actor;
      }
    },
    deleteActor: {
      type: ActorType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) }
      },
      async resolve(parent, args, context) {
        checkPermission(context, 'delete:actors');
        const actor = await Actor.findByPk(args.id);
        if (!actor) {
          throw new Error('Acteur non trouvé');
        }
        await actor.destroy();
        return actor;
      }
    },
    // Relation mutations
    addActorToMovie: {
      type: MovieType,
      args: {
        movieId: { type: new GraphQLNonNull(GraphQLID) },
        actorId: { type: new GraphQLNonNull(GraphQLID) }
      },
      async resolve(parent, args, context) {
        checkPermission(context, 'update:movies');
        const movie = await Movie.findByPk(args.movieId);
        const actor = await Actor.findByPk(args.actorId);

        if (!movie || !actor) {
          throw new Error('Film ou acteur non trouvé');
        }

        await movie.addActor(actor);
        return Movie.findByPk(args.movieId, {
          include: [{ model: Actor }]
        });
      }
    },
    removeActorFromMovie: {
      type: MovieType,
      args: {
        movieId: { type: new GraphQLNonNull(GraphQLID) },
        actorId: { type: new GraphQLNonNull(GraphQLID) }
      },
      async resolve(parent, args, context) {
        checkPermission(context, 'update:movies');
        const movie = await Movie.findByPk(args.movieId);
        const actor = await Actor.findByPk(args.actorId);

        if (!movie || !actor) {
          throw new Error('Film ou acteur non trouvé');
        }

        await movie.removeActor(actor);
        return Movie.findByPk(args.movieId, {
          include: [{ model: Actor }]
        });
      }
    }
  }
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation
}); 