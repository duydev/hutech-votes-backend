const config = require('config');
const { Sequelize, DataTypes } = require('sequelize');
const sequelizePaginate = require('sequelize-paginate');

const dbURI = process.env.DB_URI || config.get('db');

const sequelize = new Sequelize(dbURI);

sequelize
  .authenticate()
  .then(async () => {
    await sequelize.sync();

    console.log('Connection has been established successfully.');
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
  });

const Category = sequelize.define(
  'Category',
  {
    name: DataTypes.STRING
  },
  {
    tableName: 'categories'
  }
);

sequelizePaginate.paginate(Category);

const Candidate = sequelize.define(
  'Candidate',
  {
    categoryId: {
      type: DataTypes.INTEGER,
      field: 'category_id',
      references: {
        model: Category,
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    image: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: ''
    },
    votes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  },
  {
    tableName: 'candidates'
  }
);

sequelizePaginate.paginate(Candidate);

const VoteHistory = sequelize.define(
  'VoteHistory',
  {
    candidateId: {
      type: DataTypes.INTEGER,
      field: 'candidate_id',
      references: {
        model: Candidate,
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    votes: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: 'vote_history'
  }
);

sequelizePaginate.paginate(VoteHistory);

module.exports = {
  Category,
  Candidate,
  VoteHistory
};
