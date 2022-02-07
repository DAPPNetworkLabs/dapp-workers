'use strict';
module.exports = (sequelize, DataTypes) => {
  const UsageinFo = sequelize.define('UsageinFo', {
    key: { type: DataTypes.INTEGER, unique: true },
    io_usage: DataTypes.INTEGER,
    storage_usage: DataTypes.INTEGER
  }, {
    paranoid: true,
    version: true,
    timestamps: true,
  });
  return UsageinFo;
};
