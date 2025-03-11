const express = require('express');
const router = express.Router();
const { Actor, Movie } = require('../models/associations');
const { auth, requirePermission } = require('../middleware/auth');

// GET all actors with pagination
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: actors } = await Actor.findAndCountAll({
      include: [{
        model: Movie,
        attributes: ['id', 'title'],
        through: { attributes: [] }
      }],
      offset,
      limit,
      order: [['name', 'ASC']]
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      actors,
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
    console.error('Erreur lors de la récupération des acteurs:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET a single actor
router.get('/:id', auth, async (req, res) => {
  try {
    const actor = await Actor.findByPk(req.params.id, {
      include: [{
        model: Movie,
        through: { attributes: [] }
      }]
    });

    if (!actor) {
      return res.status(404).json({ message: 'Acteur non trouvé' });
    }

    res.json(actor);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'acteur:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST a new actor
router.post('/', auth, requirePermission('create:actors'), async (req, res) => {
  try {
    const actor = await Actor.create(req.body);
    res.status(201).json(actor);
  } catch (error) {
    console.error('Erreur lors de la création de l\'acteur:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT/UPDATE an actor
router.put('/:id', auth, requirePermission('update:actors'), async (req, res) => {
  try {
    const actor = await Actor.findByPk(req.params.id);
    if (!actor) {
      return res.status(404).json({ message: 'Acteur non trouvé' });
    }

    await actor.update(req.body);
    res.json(actor);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'acteur:', error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE an actor
router.delete('/:id', auth, requirePermission('delete:actors'), async (req, res) => {
  try {
    const actor = await Actor.findByPk(req.params.id);
    if (!actor) {
      return res.status(404).json({ message: 'Acteur non trouvé' });
    }

    await actor.destroy();
    res.json({ message: 'Acteur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'acteur:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add actor to movie
router.post('/:actorId/movies/:movieId', async (req, res) => {
  try {
    const actor = await Actor.findById(req.params.actorId);
    const movie = await Movie.findById(req.params.movieId);

    if (!actor || !movie) {
      return res.status(404).json({ message: 'Acteur ou film non trouvé' });
    }

    if (!actor.movies.includes(movie._id)) {
      actor.movies.push(movie._id);
      await actor.save();
    }

    if (!movie.actors.includes(actor._id)) {
      movie.actors.push(actor._id);
      await movie.save();
    }

    res.json({ message: 'Acteur ajouté au film avec succès' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Remove actor from movie
router.delete('/:actorId/movies/:movieId', async (req, res) => {
  try {
    const actor = await Actor.findById(req.params.actorId);
    const movie = await Movie.findById(req.params.movieId);

    if (!actor || !movie) {
      return res.status(404).json({ message: 'Acteur ou film non trouvé' });
    }

    actor.movies = actor.movies.filter(m => m.toString() !== req.params.movieId);
    await actor.save();

    movie.actors = movie.actors.filter(a => a.toString() !== req.params.actorId);
    await movie.save();

    res.json({ message: 'Acteur retiré du film avec succès' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 