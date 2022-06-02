'use strict';
module.exports = (sequelize, DataTypes) => {
  const UsageInfo = sequelize.define('UsageInfo', {
    key: { type: DataTypes.INTEGER, unique: true },
    dockerId: DataTypes.STRING,
    io_usage: DataTypes.INTEGER,
    storage_usage: DataTypes.INTEGER,
    last_io_usage: DataTypes.INTEGER
  }, {
    paranoid: true,
    version: true,
    timestamps: true,
  });
  return UsageInfo;
};
