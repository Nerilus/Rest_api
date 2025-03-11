const express = require('express');
const router = express.Router();
const { Movie, Actor } = require('../models/associations');
const { auth, requirePermission } = require('../middleware/auth');
const upload = require('../config/multer');
const fs = require('fs').promises;
const path = require('path');

// GET all movies with pagination
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: movies } = await Movie.findAndCountAll({
      include: [{
        model: Actor,
        attributes: ['id', 'name'],
        through: { attributes: [] }
      }],
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      movies: movies.map(movie => ({
        ...movie.toJSON(),
        coverImage: movie.coverImage ? `/uploads/${movie.coverImage}` : null
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des films:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET a single movie
router.get('/:id', auth, async (req, res) => {
  try {
    const movie = await Movie.findByPk(req.params.id, {
      include: [{
        model: Actor,
        through: { attributes: [] }
      }]
    });

    if (!movie) {
      return res.status(404).json({ message: 'Film non trouvé' });
    }

    const movieJson = movie.toJSON();
    if (movieJson.coverImage) {
      movieJson.coverImage = `/uploads/${movieJson.coverImage}`;
    }
    res.json(movieJson);
  } catch (error) {
    console.error('Erreur lors de la récupération du film:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST a new movie
router.post('/', auth, requirePermission('create:movies'), upload.single('coverImage'), async (req, res) => {
  try {
    const movieData = req.body;
    if (req.file) {
      movieData.coverImage = req.file.filename;
    }

    const movie = await Movie.create(movieData);
    res.status(201).json(movie);
  } catch (error) {
    // Si une erreur survient, supprimer l'image si elle a été téléchargée
    if (req.file) {
      await fs.unlink(path.join('uploads', req.file.filename));
    }
    console.error('Erreur lors de la création du film:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT/UPDATE a movie
router.put('/:id', auth, requirePermission('update:movies'), upload.single('coverImage'), async (req, res) => {
  try {
    const movie = await Movie.findByPk(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Film non trouvé' });
    }

    // Si une nouvelle image est téléchargée, supprimer l'ancienne
    if (req.file) {
      if (movie.coverImage) {
        try {
          await fs.unlink(path.join('uploads', movie.coverImage));
        } catch (error) {
          console.error('Erreur lors de la suppression de l\'ancienne image:', error);
        }
      }
      req.body.coverImage = req.file.filename;
    }

    await movie.update(req.body);
    res.json(movie);
  } catch (error) {
    // Si une erreur survient, supprimer la nouvelle image si elle a été téléchargée
    if (req.file) {
      await fs.unlink(path.join('uploads', req.file.filename));
    }
    console.error('Erreur lors de la mise à jour du film:', error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE a movie
router.delete('/:id', auth, requirePermission('delete:movies'), async (req, res) => {
  try {
    const movie = await Movie.findByPk(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Film non trouvé' });
    }

    // Supprimer l'image de couverture si elle existe
    if (movie.coverImage) {
      try {
        await fs.unlink(path.join('uploads', movie.coverImage));
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'image:', error);
      }
    }

    await movie.destroy();
    res.json({ message: 'Film supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du film:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add actor to movie
router.post('/:movieId/actors/:actorId', auth, requirePermission('update:movies'), async (req, res) => {
  try {
    const movie = await Movie.findByPk(req.params.movieId);
    const actor = await Actor.findByPk(req.params.actorId);

    if (!movie || !actor) {
      return res.status(404).json({ message: 'Film ou acteur non trouvé' });
    }

    await movie.addActor(actor);
    res.json({ message: 'Acteur ajouté au film avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'acteur au film:', error);
    res.status(500).json({ message: error.message });
  }
});

// Remove actor from movie
router.delete('/:movieId/actors/:actorId', auth, requirePermission('update:movies'), async (req, res) => {
  try {
    const movie = await Movie.findByPk(req.params.movieId);
    const actor = await Actor.findByPk(req.params.actorId);

    if (!movie || !actor) {
      return res.status(404).json({ message: 'Film ou acteur non trouvé' });
    }

    await movie.removeActor(actor);
    res.json({ message: 'Acteur retiré du film avec succès' });
  } catch (error) {
    console.error('Erreur lors du retrait de l\'acteur du film:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;