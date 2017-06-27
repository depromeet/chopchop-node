'use strict';

/**
 *  Define a model of board table.
 */
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Board', {
    board_id       : { type : DataTypes.INTEGER, primaryKey : true, autoIncrement: true, allowNull : false },
    board_name     : { type : DataTypes.STRING, allowNull : false },
    board_img      : { type : DataTypes.STRING(50) },
    board_catagory : { type : DataTypes.STRING(50) },
    board_popular  : { type : DataTypes.INTEGER },
    board_uid      : { type : DataTypes.INTEGER },
  },
  {
    classMethods: {},
		tableName: 'board',
		freezeTableName: true,
		underscored: true,
		timestamps: false
  });
};
