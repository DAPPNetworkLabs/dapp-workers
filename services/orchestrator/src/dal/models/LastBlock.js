'use strict';
module.exports = (sequelize, DataTypes) => {
  const LastBlock = sequelize.define('LastBlock', {
    key: { type: DataTypes.string, unique: true },
    last_block: DataTypes.INTEGER
  }, {});
  LastBlock.associate = function(models) {
    // associations can be defined here
  };
  return LastBlock;
};