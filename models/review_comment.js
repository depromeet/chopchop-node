/**
 * Created by yujajin on 27/03/2017.
 */
'use strict'

/**
 *  Define a model of review_comment table.
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define("Review_Comment", {
            rc_id        : { type : DataTypes.INTEGER, primaryKey : true, autoIncrement: true, allowNull : false },
            rc_userid    : { type : DataTypes.INTEGER},
            rc_reviewid  : { type : DataTypes.INTEGER},
            rc_comment   : { type : DataTypes.STRING(20)}
        },
        {
            classMethods: {},
            tableName: 'review_comment',
            freezeTableName: true,
            underscored: true,
            timestamps: false
        });
};
