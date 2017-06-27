/**
 * Created by yujajin on 22/06/2017.
 */

'use strict';

/**
 *  Define a model of restaurant_follow table.
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define("Restaurant_Follow", {
            rf_id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false},
            rf_userid: {type: DataTypes.INTEGER},
            rf_resid: {type: DataTypes.INTEGER}
        },
        {
            classMethods: {},
            tableName: 'restaurant_follow',
            freezeTableName: true,
            underscored: true,
            timestamps: false
        });
};

