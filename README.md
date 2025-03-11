# API de Location de Films avec GraphQL

Cette API permet de gérer un système de location de films avec authentification, gestion des acteurs et des films.

## Technologies Utilisées

- Node.js
- Express.js
- GraphQL
- MariaDB
- Sequelize (ORM)
- Docker & Docker Compose
- JWT pour l'authentification

## Prérequis

- Docker et Docker Compose installés
- Postman pour tester l'API
- Node.js (pour le développement local)

## Installation

1. Cloner le repository :
```bash
git clone <votre-repo>
cd movie-rental-api
```

2. Lancer l'application avec Docker :
```bash
docker-compose up --build
```

L'application sera disponible sur `http://localhost:3000`

## Structure de la Base de Données

### Tables
- `Users` : Gestion des utilisateurs
- `Movies` : Catalogue de films
- `Actors` : Information sur les acteurs
- `MovieActor` : Relation many-to-many entre films et acteurs
- `RefreshTokens` : Gestion des tokens de rafraîchissement

## Endpoints GraphQL

L'API GraphQL est accessible à l'URL : `http://localhost:3000/graphql`

### Authentification

#### Inscription
```graphql
mutation {
  register(
    email: "user@example.com"
    password: "password123"
    firstName: "John"
    lastName: "Doe"
  ) {
    user {
      id
      email
      firstName
      lastName
      role
    }
    accessToken
    refreshToken
  }
}
```

#### Connexion
```graphql
mutation {
  login(
    email: "user@example.com"
    password: "password123"
  ) {
    user {
      id
      email
      role
    }
    accessToken
    refreshToken
  }
}
```

#### Déconnexion
```graphql
mutation {
  logout
}
```

#### Rafraîchir le Token
```graphql
mutation {
  refreshToken(
    refreshToken: "votre-refresh-token"
  ) {
    accessToken
    refreshToken
  }
}
```

### Gestion des Films

#### Lister les Films (avec pagination)
```graphql
query {
  movies(page: 1, limit: 10) {
    movies {
      id
      title
      director
      releaseYear
      genre
      rating
      available
      rentalPrice
      actors {
        id
        name
      }
    }
    pagination {
      currentPage
      totalPages
      totalItems
      hasNextPage
      hasPrevPage
    }
  }
}
```

#### Ajouter un Film
```graphql
mutation {
  addMovie(
    title: "Inception"
    director: "Christopher Nolan"
    releaseYear: 2010
    genre: "Sci-Fi"
    rating: 8.8
    rentalPrice: 4.99
  ) {
    id
    title
  }
}
```

### Gestion des Acteurs

#### Lister les Acteurs (avec pagination)
```graphql
query {
  actors(page: 1, limit: 10) {
    actors {
      id
      name
      birthDate
      nationality
      biography
      movies {
        id
        title
      }
    }
    pagination {
      currentPage
      totalPages
      totalItems
    }
  }
}
```

#### Ajouter un Acteur
```graphql
mutation {
  addActor(
    name: "Leonardo DiCaprio"
    birthDate: "1974-11-11"
    nationality: "American"
    biography: "Academy Award-winning actor..."
  ) {
    id
    name
  }
}
```

## Tests avec Postman

1. Importer la collection Postman :
   - Ouvrir Postman
   - Cliquer sur "Import"
   - Créer une nouvelle collection "Movie Rental API"

2. Configuration de l'environnement :
   - Créer un nouvel environnement
   - Ajouter les variables :
     - `BASE_URL` : `http://localhost:3000`
     - `ACCESS_TOKEN` : (à remplir après login)
     - `REFRESH_TOKEN` : (à remplir après login)

3. Tests des endpoints :

   a. Inscription (Register) :
   ```
   POST {{BASE_URL}}/graphql
   Headers:
   Content-Type: application/json

   Body (GraphQL):
   {
     "query": "mutation { register(email: \"test@example.com\", password: \"password123\", firstName: \"Test\", lastName: \"User\") { user { id email } accessToken refreshToken } }"
   }
   ```

   b. Connexion (Login) :
   ```
   POST {{BASE_URL}}/graphql
   Headers:
   Content-Type: application/json

   Body (GraphQL):
   {
     "query": "mutation { login(email: \"test@example.com\", password: \"password123\") { user { id email } accessToken refreshToken } }"
   }
   ```

   c. Requêtes authentifiées :
   ```
   POST {{BASE_URL}}/graphql
   Headers:
   Content-Type: application/json
   Authorization: Bearer {{ACCESS_TOKEN}}

   Body (GraphQL):
   {
     "query": "query { movies { movies { id title } pagination { totalItems } } }"
   }
   ```

## Gestion de la Base de Données

### Restaurer le dump SQL
```bash
# Copier le fichier dump dans le conteneur
docker cp dump.sql movie-rental-api_mariadb_1:/dump.sql

# Exécuter le dump
docker-compose exec mariadb mariadb -u movieapp -pmovieapp_password movieapp_db < dump.sql
```

### Créer un nouveau dump
```bash
docker-compose exec mariadb mysqldump -u movieapp -pmovieapp_password movieapp_db > backup.sql
```

## Sécurité

- Authentification basée sur JWT avec refresh tokens
- Contrôle d'accès basé sur les rôles (RBAC)
- Protection contre les injections SQL via Sequelize
- Validation des données entrantes
- Hachage des mots de passe avec bcrypt

## Rôles et Permissions

### Utilisateur (user)
- Lecture des films et acteurs
- Mise à jour de son profil

### Administrateur (admin)
- Toutes les permissions utilisateur
- Création/Modification/Suppression des films
- Création/Modification/Suppression des acteurs
- Gestion des utilisateurs

## Variables d'Environnement

Créer un fichier `.env` à la racine du projet :
```env
DB_HOST=mariadb
DB_USER=movieapp
DB_PASSWORD=movieapp_password
DB_NAME=movieapp_db
JWT_SECRET=votre_secret_jwt_super_securise
JWT_REFRESH_SECRET=votre_secret_refresh_jwt_super_securise
PORT=3000
```

## Développement

Pour le développement local sans Docker :
```bash
npm install
npm run dev
```

## Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -am 'Ajout d'une nouvelle fonctionnalité'`)
4. Push la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request 



1. Register (Inscription)
POST http://localhost:3000/auth/register
Headers: 
- Content-Type: application/json
Body:
{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
}

2. Login (Connexion)
POST http://localhost:3000/auth/login
Headers:
- Content-Type: application/json
Body:
{
    "email": "test@example.com",
    "password": "password123"
}

3. Refresh Token
POST http://localhost:3000/auth/refresh-token
Headers:
- Authorization: Bearer {{REFRESH_TOKEN}}
- Content-Type: application/json

4. Logout (Déconnexion)
POST http://localhost:3000/auth/logout
Headers:
- Authorization: Bearer {{ACCESS_TOKEN}}
- Content-Type: application/json

5. Get Profile (Obtenir le profil)
GET http://localhost:3000/auth/profile
Headers:
- Authorization: Bearer {{ACCESS_TOKEN}}

6. Update Profile (Mettre à jour le profil)
PUT http://localhost:3000/auth/profile
Headers:
- Authorization: Bearer {{ACCESS_TOKEN}}
- Content-Type: application/json
Body:
{
    "firstName": "John Updated",
    "lastName": "Doe Updated",
    "password": "newpassword123"
}




1. Get All Movies
GET http://localhost:3000/api/movies
Headers:
- Authorization: Bearer {{ACCESS_TOKEN}}

2. Get Single Movie
GET http://localhost:3000/api/movies/:id
Headers:
- Authorization: Bearer {{ACCESS_TOKEN}}

3. Create Movie
POST http://localhost:3000/api/movies
Headers:
- Authorization: Bearer {{ACCESS_TOKEN}}
- Content-Type: application/json
Body:
{
    "title": "Inception",
    "director": "Christopher Nolan",
    "releaseYear": 2010,
    "genre": "Sci-Fi",
    "rating": 8.8,
    "rentalPrice": 4.99
}

4. Update Movie
PUT http://localhost:3000/api/movies/:id
Headers:
- Authorization: Bearer {{ACCESS_TOKEN}}
- Content-Type: application/json
Body:
{
    "rating": 9.0,
    "rentalPrice": 5.99
}

5. Delete Movie
DELETE http://localhost:3000/api/movies/:id
Headers:
- Authorization: Bearer {{ACCESS_TOKEN}}




1. Get All Actors
GET http://localhost:3000/api/actors
Headers:
- Authorization: Bearer {{ACCESS_TOKEN}}

2. Get Single Actor
GET http://localhost:3000/api/actors/:id
Headers:
- Authorization: Bearer {{ACCESS_TOKEN}}

3. Create Actor
POST http://localhost:3000/api/actors
Headers:
- Authorization: Bearer {{ACCESS_TOKEN}}
- Content-Type: application/json
Body:
{
    "name": "Leonardo DiCaprio",
    "birthDate": "1974-11-11",
    "nationality": "American",
    "biography": "Academy Award-winning actor..."
}

4. Update Actor
PUT http://localhost:3000/api/actors/:id
Headers:
- Authorization: Bearer {{ACCESS_TOKEN}}
- Content-Type: application/json
Body:
{
    "biography": "Updated biography..."
}

5. Delete Actor
DELETE http://localhost:3000/api/actors/:id
Headers:
- Authorization: Bearer {{ACCESS_TOKEN}}



1. Add Actor to Movie
POST http://localhost:3000/api/movies/:movieId/actors/:actorId
Headers:
- Authorization: Bearer {{ACCESS_TOKEN}}

2. Remove Actor from Movie
DELETE http://localhost:3000/api/movies/:movieId/actors/:actorId
Headers:
- Authorization: Bearer {{ACCESS_TOKEN}}