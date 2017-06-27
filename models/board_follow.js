/**
 * Created by yujajin on 26/03/2017.
 */
'use strict';

/**
 *  Define a model of board table.
 */
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Board_Follow', {
    bf_id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false},
    bf_userid: {type: DataTypes.INTEGER},
    bf_boardid: {type: DataTypes.INTEGER}
  },
  {
    classMethods: {},
    tableName: 'board_follow',
    freezeTableName: true,
    underscored: true,
    timestamps: false
  });
};
