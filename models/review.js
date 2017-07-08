'use strict'

/**
 *  Define a model of review table.
 */
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Review', {
    review_id       : { type : DataTypes.INTEGER, primaryKey : true, autoIncrement: true, allowNull : false },
    review_boardid  : { type : DataTypes.INTEGER, allowNull : false },
    review_uid      : { type : DataTypes.INTEGER, allowNull : false },
    review_username : { type : DataTypes.STRING(20) },
    review_nickname : { type : DataTypes.STRING(20) },
    review_resid    : { type : DataTypes.INTEGER, allowNull : false },
    review_resname  : { type : DataTypes.STRING(20), allowNull : false },
    review_resadd   : { type : DataTypes.STRING(20) },
    review_score    : { type : DataTypes.INTEGER, allowNull : false },
    review_story    : { type : DataTypes.STRING(100) },
    review_img      : { type : DataTypes.STRING(20) },
    review_like     : { type : DataTypes.INTEGER },
    review_bad      : { type : DataTypes.INTEGER },
    review_report   : { type : DataTypes.INTEGER },
  },
  {
	  classMethods: {},
		tableName: 'review',
		freezeTableName: true,
		underscored: true,
		timestamps: false
  });
};
