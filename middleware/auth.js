const jwt = require('jsonwebtoken');
const { User, RefreshToken } = require('../models/associations');
const crypto = require('crypto');
const { Op } = require('sequelize');

const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt_super_securise';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'votre_secret_refresh_jwt_super_securise';
const JWT_EXPIRES_IN = '15m';  // Access token expire après 15 minutes
const JWT_REFRESH_EXPIRES_IN = '7d';  // Refresh token expire après 7 jours

// Permissions par rôle
const ROLE_PERMISSIONS = {
  user: [
    'read:movies',
    'read:actors',
    'update:profile'
  ],
  admin: [
    'read:movies',
    'create:movies',
    'update:movies',
    'delete:movies',
    'read:actors',
    'create:actors',
    'update:actors',
    'delete:actors',
    'update:profile',
    'read:users',
    'update:users'
  ]
};

// Génération du token JWT
const generateTokens = async (user) => {
  try {
    // Générer l'access token
    const accessToken = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Générer le refresh token
    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Sauvegarder le refresh token dans la base de données
    await RefreshToken.create({
      token: refreshToken,
      UserId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
    });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Erreur lors de la génération des tokens:', error);
    throw error;
  }
};

// Vérifier les permissions
const hasPermission = (userPermissions, requiredPermission) => {
  return userPermissions.includes(requiredPermission);
};

// Middleware d'authentification
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token d\'authentification requis' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }

    req.user = user;
    req.permissions = ROLE_PERMISSIONS[user.role];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré' });
    }
    return res.status(401).json({ message: 'Token invalide' });
  }
};

// Middleware pour vérifier les permissions
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.permissions || !hasPermission(req.permissions, permission)) {
      return res.status(403).json({ 
        message: 'Accès refusé - Permission requise: ' + permission 
      });
    }
    next();
  };
};

// Middleware pour vérifier le rôle admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Accès refusé - Droits administrateur requis' });
  }
};

// Rafraîchir le token
const refreshAccessToken = async (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, message: 'Refresh token requis' };
    }

    const refreshToken = authHeader.split(' ')[1];
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    // Vérifier si le refresh token existe et est valide
    const tokenDoc = await RefreshToken.findOne({
      where: {
        token: refreshToken,
        isRevoked: false,
        expiresAt: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!tokenDoc) {
      return { success: false, message: 'Refresh token invalide ou expiré' };
    }

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return { success: false, message: 'Utilisateur non trouvé' };
    }

    // Générer un nouveau access token
    const accessToken = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    return {
      success: true,
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    };
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    return { success: false, message: 'Erreur lors du rafraîchissement du token' };
  }
};

// Révoquer tous les refresh tokens d'un utilisateur
const revokeAllUserTokens = async (userId) => {
  try {
    await RefreshToken.update(
      { isRevoked: true },
      { 
        where: { 
          UserId: userId,
          isRevoked: false
        }
      }
    );
  } catch (error) {
    console.error('Erreur lors de la révocation des tokens:', error);
    throw error;
  }
};

// Middleware GraphQL pour vérifier l'authentification
const graphqlAuth = async (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isAuthenticated: false };
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return { isAuthenticated: false };
    }

    return {
      isAuthenticated: true,
      user: user
    };
  } catch (error) {
    return { isAuthenticated: false };
  }
};

module.exports = {
  generateTokens,
  auth,
  isAdmin,
  requirePermission,
  refreshAccessToken,
  revokeAllUserTokens,
  graphqlAuth,
  ROLE_PERMISSIONS,
  JWT_SECRET
}; 