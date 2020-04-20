const { Router } = require('express');
const { Category } = require('../../db');

const router = Router();

router.get('/', async (req, res) => {
  try {
    let { page, limit, sortField, sortType } = req.query;

    if (!page || Number.isNaN(page) || page < 1) {
      page = 1;
    }

    if (!limit || Number.isNaN(limit) || limit < 1) {
      limit = 10;
    }

    if (!sortField) {
      sortField = 'id';
      sortType = 'ASC';
    }

    sortType = sortType ? String(sortType).toUpperCase() : sortType;

    if (!sortType || !['ASC', 'DESC'].includes(sortType)) {
      sortType = 'ASC';
    }

    const result = await Category.paginate({
      paginate: limit,
      page,
      order: [[sortField, sortType]]
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

    const result = await Category.findByPk(id);

    if (!result) {
      res.status(404).json({
        message: 'Category not found.'
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

module.exports = {
  path: `/categories`,
  router
};
