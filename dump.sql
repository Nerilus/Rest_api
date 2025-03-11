-- MariaDB dump
SET FOREIGN_KEY_CHECKS=0;

-- Users table
DROP TABLE IF EXISTS `Users`;
CREATE TABLE `Users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `firstName` VARCHAR(255) NOT NULL,
    `lastName` VARCHAR(255) NOT NULL,
    `role` ENUM('user', 'admin') DEFAULT 'user',
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Movies table
DROP TABLE IF EXISTS `Movies`;
CREATE TABLE `Movies` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `director` VARCHAR(255) NOT NULL,
    `releaseYear` INT NOT NULL,
    `genre` VARCHAR(255) NOT NULL,
    `rating` FLOAT NOT NULL,
    `available` BOOLEAN DEFAULT true,
    `rentalPrice` FLOAT NOT NULL,
    `coverImage` VARCHAR(255),
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (`releaseYear` >= 1888 AND `releaseYear` <= 2030),
    CHECK (`rating` >= 0 AND `rating` <= 10),
    CHECK (`rentalPrice` >= 0)
);

-- Actors table
DROP TABLE IF EXISTS `Actors`;
CREATE TABLE `Actors` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `birthDate` DATE NOT NULL,
    `nationality` VARCHAR(255) NOT NULL,
    `biography` TEXT NOT NULL,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- MovieActor relation table
DROP TABLE IF EXISTS `MovieActor`;
CREATE TABLE `MovieActor` (
    `movieId` INT,
    `actorId` INT,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`movieId`, `actorId`),
    FOREIGN KEY (`movieId`) REFERENCES `Movies`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`actorId`) REFERENCES `Actors`(`id`) ON DELETE CASCADE
);

-- RefreshTokens table
DROP TABLE IF EXISTS `RefreshTokens`;
CREATE TABLE `RefreshTokens` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `token` VARCHAR(255) NOT NULL UNIQUE,
    `UserId` INT NOT NULL,
    `expiresAt` TIMESTAMP NOT NULL,
    `isRevoked` BOOLEAN DEFAULT false,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`UserId`) REFERENCES `Users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Insert sample data
INSERT INTO `Users` (`email`, `password`, `firstName`, `lastName`, `role`) VALUES
('admin@example.com', '$2a$10$XgXB8p6VXeC5K8K5H5XkP.4Rl8Tx.7KbX8hOzB.I5K0F.1Y1tQZK2', 'Admin', 'User', 'admin'),
('user@example.com', '$2a$10$XgXB8p6VXeC5K8K5H5XkP.4Rl8Tx.7KbX8hOzB.I5K0F.1Y1tQZK2', 'Regular', 'User', 'user');

INSERT INTO `Movies` (`title`, `director`, `releaseYear`, `genre`, `rating`, `rentalPrice`) VALUES
('Inception', 'Christopher Nolan', 2010, 'Sci-Fi', 8.8, 4.99),
('The Godfather', 'Francis Ford Coppola', 1972, 'Drama', 9.2, 3.99),
('Pulp Fiction', 'Quentin Tarantino', 1994, 'Crime', 8.9, 4.49);

INSERT INTO `Actors` (`name`, `birthDate`, `nationality`, `biography`) VALUES
('Leonardo DiCaprio', '1974-11-11', 'American', 'Academy Award-winning actor known for various successful films.'),
('Al Pacino', '1940-04-25', 'American', 'Legendary actor known for his intense method acting style.'),
('Samuel L. Jackson', '1948-12-21', 'American', 'One of the most widely recognized actors in Hollywood.');

INSERT INTO `MovieActor` (`movieId`, `actorId`) VALUES
(1, 1),
(2, 2),
(3, 3);

SET FOREIGN_KEY_CHECKS=1; 