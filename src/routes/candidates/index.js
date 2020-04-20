const { Router } = require('express');
const { Op } = require('sequelize');
const { Candidate } = require('../../db');
const { generateId, vote, getCandidateVotesById } = require('../../utils');

const router = Router();

router.get('/', async (req, res) => {
  try {
    let where;

    let { page, limit, sortField, sortType, categoryId, name } = req.query;

    if (!page || Number.isNaN(page) || page < 1) {
      page = 1;
    }

    if (!limit || Number.isNaN(limit) || limit < 1) {
      limit = 10;
    }

    if (!sortField) {
      sortField = 'votes';
      sortType = 'DESC';
    }

    sortType = sortType ? String(sortType).toUpperCase() : sortType;

    if (!sortType || !['ASC', 'DESC'].includes(sortType)) {
      sortType = 'ASC';
    }

    if (categoryId && !Number.isNaN(categoryId)) {
      where = {
        categoryId
      };
    }

    if (name) {
      where = {
        name: {
          [Op.iLike]: `%${name}%`
        }
      };
    }

    const result = await Candidate.paginate({
      paginate: limit,
      page,
      order: [[sortField, sortType]],
      where
    });

    res.json(result);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Internal Server Error'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Candidate.findByPk(id);

    if (!result) {
      res.status(404).json({
        message: 'Candidate not found.'
      });

      return;
    }

    res.json(result);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Internal Server Error'
    });
  }
});

router.get('/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;

    const candidate = await Candidate.findByPk(id);

    if (!candidate) {
      res.status(404).json({
        message: 'Candidate not found.'
      });

      return;
    }

    const fbId = generateId();

    const result = {
      success: await vote(id, fbId)
    };

    // const votes = await getCandidateVotesById(id);

    // candidate.votes = votes;
    // await candidate.save();

    res.json(result);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Internal Server Error'
    });
  }
});

module.exports = {
  path: `/candidates`,
  router
};
