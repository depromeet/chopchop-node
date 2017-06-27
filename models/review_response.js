'use strict'

/**
 *  Define a model of review_response table.
 */
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Review_Response", {
    rvr_id       : { type : DataTypes.INTEGER, primaryKey : true, autoIncrement: true, allowNull : false },
    rvr_reviewid : { type : DataTypes.INTEGER, allowNull : false },
    rvr_userid   : { type : DataTypes.INTEGER, allowNull : false },
    rvr_like     : { type : DataTypes.INTEGER },
    rvr_bad      : { type : DataTypes.INTEGER },
    rvr_report   : { type : DataTypes.INTEGER }
  }, 
  {
    classMethods: {}, 
    tableName: 'review_response',
    freezeTableName: true,
    underscored: true,
    timestamps: false
  });
};
