/**
 * Created by yujajin on 27/03/2017.
 */
var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();
var router = express.Router();
var models = require('../models');

// 리뷰 좋아요
// 리뷰 리스폰스
router.post('/', responseReview);

// 리뷰 리스폰스 취소
router.delete('/', deresponseReview);

//리뷰 리스폰스 put, review_like++, rvr_userid, rvr_reviewid body로 받음
function responseReview(req, res) {
    var rvrinfo = req.body,

        result = {
            review_id   : null,
            status      : null,
            reason      : null
        },

        preventDuplication = {
            rvr_userid      : rvrinfo.rvr_userid,
            rvr_reviewid    : rvrinfo.rvr_reviewid
        },

        reviewIdMatched = {
            review_id: rvrinfo.rvr_reviewid
        },

        value = {
            review_like     : 0,
            review_bad      : 0,
            review_report   : 0
        };

    models.Review_Response.findAll({where:preventDuplication}).then(function (response) {
        // 리스폰스 중복방지
        if(response.length > 0) {
            result.status = 'F';
            result.reason = 'Duplicate responses';
            res.status(200).json(result);
        }
        else{
            models.Review_Response.create(rvrinfo)
            models.Review.findAll({where: reviewIdMatched}).then(function(review){
                if      (rvrinfo.rvr_like == 1)     {value.review_like   = review[0].dataValues.review_like + 1}
                else if (rvrinfo.rvr_bad == 1)      {value.review_bad    = review[0].dataValues.review_bad + 1}
                else if (rvrinfo.rvr_report == 1)   {value.review_report = review[0].dataValues.review_report + 1}

                models.Review.update(value, {where: reviewIdMatched}).then(function () {
                    result.review_id = rvrinfo.rvr_reviewid;
                    result.status = 'S';
                    res.status(200).json(result);
                }, function (err) {
                    result.status = 'F';
                    result.reason = err;
                    res.status(400).json(result);
                })
            })
        }
    })
}

// 리뷰 리스폰스 취소 put, review_like --, rvr_userid, rvr_reviewid body로 받음,
function deresponseReview(req, res) {
    var rvrinfo = req.body,

        result = {
            review_id   : null,
            status      : null,
            reason      : null
        },

        preventDuplication = {
            rvr_userid      : rvrinfo.rvr_userid,
            rvr_reviewid    : rvrinfo.rvr_reviewid
        },

        value = {
            review_like     : 0,
            review_bad      : 0,
            review_report   : 0
        },

        reviewIdMatched = {
            review_id : rvrinfo.rvr_reviewid
        },

        destoryCondition = {
            rvr_reviewid: rvrinfo.rvr_reviewid
        }

    models.Review_Response.findAll({where:preventDuplication}).then(function (response) {
        // 리스폰스 중복방지
        if(response.length == 0) {
            result.status = 'F';
            result.reason = 'Duplicate responses';
            res.status(200).json(result);
        }
        else {
            models.Review_Response.destroy({where: destoryCondition})
            models.Review.findAll({where: reviewIdMatched}).then(function (review) {
                if      (rvrinfo.rvr_like == 1)     {value.review_like      = review[0].dataValues.review_like - 1}
                else if (rvrinfo.rvr_bad == 1)      {value.review_bad       = review[0].dataValues.review_bad - 1}
                else if (rvrinfo.rvr_report == 1)   {value.review_report    = review[0].dataValues.review_report - 1}

                models.Review.update(value, {where: reviewIdMatched}).then(function () {
                    result.review_id = rvrinfo.rvr_reviewid;
                    result.status = 'S';
                    res.status(200).json(result);
                }, function (err) {
                    result.status = 'F';
                    result.reason = err;
                    res.status(400).json(result);
                })
            })
        }
    })
}

module.exports = router;
