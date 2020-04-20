const { Router } = require('express');
const { Op } = require('sequelize');
const { Candidate, VoteHistory } = require('../../db');
const moment = require('moment-timezone');
const _ = require('lodash');

const router = Router();

router.get('/', async (req, res) => {
  try {
    const now = moment('2020-04-20').toDate();
    const past = moment('2020-04-04').toDate();

    let where = {};
    let { categoryId } = req.query;

    if (categoryId && !Number.isNaN(categoryId)) {
      where.categoryId = categoryId;
    }

    const candidates = await Candidate.findAll({
      attributes: ['id', 'name', 'votes', 'updatedAt'],
      where,
      order: [['votes', 'DESC']]
    });

    const latest = candidates.map(({ id, votes, updatedAt }) => ({
      candidateId: id,
      votes,
      createdAt: updatedAt
    }));

    const ids = candidates.map(({ id }) => id);

    let docs = await VoteHistory.findAll({
      where: {
        candidateId: {
          [Op.in]: ids
        },
        createdAt: {
          [Op.between]: [past, now]
        }
      },
      order: [['createdAt', 'ASC']]
    });

    docs.push(...latest);

    docs = docs.map(({ candidateId, votes, createdAt }) => {
      const newCreatedAt = moment(createdAt)
        .tz('Asia/Ho_Chi_Minh')
        .format('DD/MM/YYYY');

      return { candidateId, votes, createdAt: newCreatedAt };
    });

    docs = docs.reduce((obj, { candidateId, votes, createdAt }) => {
      if (!obj[candidateId]) obj[candidateId] = {};
      if (!obj[candidateId][createdAt]) obj[candidateId][createdAt] = [];

      obj[candidateId][createdAt].push(votes);

      return obj;
    }, {});

    docs = Object.keys(docs).reduce((obj, candidateId) => {
      let dates = docs[candidateId];

      dates = Object.keys(dates).reduce((_obj, date) => {
        maxVotes = _.max(dates[date]);

        _obj[date] = maxVotes;

        return _obj;
      }, {});

      obj[candidateId] = dates;

      return obj;
    }, {});

    const result = candidates.map(({ id, name }) => {
      const history = docs[id];

      return { id, name, history };
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

    const now = moment().toDate();
    const past = moment().subtract(14, 'days').toDate();

    const candidate = await Candidate.findByPk(id);

    if (!candidate) {
      res.status(404).json({
        message: 'Candidate not found.'
      });

      return;
    }

    const latest = {
      candidateId: candidate.id,
      votes: candidate.votes,
      createdAt: candidate.updatedAt
    };

    let docs = await VoteHistory.findAll({
      where: {
        candidateId: id,
        createdAt: {
          [Op.between]: [past, now]
        }
      },
      order: [['createdAt', 'ASC']]
    });

    docs.push(latest);

    docs = docs.map(({ candidateId, votes, createdAt }) => {
      const newCreatedAt = moment(createdAt)
        .tz('Asia/Ho_Chi_Minh')
        .format('DD/MM/YYYY');

      return { candidateId, votes, createdAt: newCreatedAt };
    });

    docs = docs.reduce((obj, { candidateId, votes, createdAt }) => {
      if (!obj[candidateId]) obj[candidateId] = {};
      if (!obj[candidateId][createdAt]) obj[candidateId][createdAt] = [];

      obj[candidateId][createdAt].push(votes);

      return obj;
    }, {});

    docs = Object.keys(docs).reduce((obj, candidateId) => {
      let dates = docs[candidateId];

      dates = Object.keys(dates).reduce((_obj, date) => {
        maxVotes = _.max(dates[date]);

        _obj[date] = maxVotes;

        return _obj;
      }, {});

      obj[candidateId] = dates;

      return obj;
    }, {});

    const result = {
      id,
      name: candidate.name,
      history: docs[id]
    };

    res.json(result);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Internal Server Error'
    });
  }
});

module.exports = {
  path: `/vote-history`,
  router
};
