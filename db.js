const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('fullfire', 'postgres', 'Rezendeev!l123', {
  host: 'localhost',
  dialect: 'postgres',
});

module.exports = sequelize;