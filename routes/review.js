var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();
var router = express.Router();
var models = require('../models');
var async = require('async');

// 리뷰 검색
router.get('/', function(req, res) {
  var data = {};
  data.where = {};
  // validate data
  if('offset' in req.query) data.offset = req.query.offset;
  if('limit' in req.query) data.limit = req.query.limit;
  if('user_id' in req.query) data.where.review_uid = req.query.user_id;
  if('board_id' in req.query) data.where.review_boardid = req.query.board_id;
  if('res_id' in req.query) data.where.review_resid = req.query.res_id;

  models.Review.findAll(data)
  .then(function(reviews) {
    if(!reviews || reviews.length==0) res.status(400).send('not found');

    async.transform(reviews, function(acc, item, index, outerCallback) {
      item.review_boardname = '';
      async.parallel([
        findUser(innerCallback),
        findBoard(innerCallback),
        findRestaurant(innerCallback)
      ], function(err, result) {
          acc.push(item);
          outerCallback(null);
      });
    }, function(err, result) {
      res.status(200).json(result);
    });

  }).catch(function(err) {
    res.status(500).json(err);
  });
});

function findUser(innerCallback) {
  // 1
  models.User.findById(item.review_uid)
  .then(function(user) {
    item.review_username = user.user_name;
    item.review_nickname = user.user_nickname;
    innerCallback(null);
  }).catch(function(err) {
    innerCallback(null);
  });
}

function findBoard(innerCallback) {
  // 2
  models.Board.findById(item.review_boardid)
  .then(function(board) {
    item.review_boardname = board.board_name;
    innerCallback(null);
  }).catch(function(err) {
    innerCallback(null);
  });
}

function findRestaurant(innerCallback) {
  // 3
  models.Restaurant.findById(item.review_resid)
  .then(function(restaurant) {
    item.review_resname = restaurant.res_name;
    item.review_resadd = restaurant.res_address;
    innerCallback(null);
  }).catch(function(err) {
    innerCallback(null);
  });
}

// 좋아요 한 리뷰 조회
router.get('/perfer/:idx', perferReview);

// 한 식당에 대한 리뷰 조회
router.get('/res/:idx', resReview)

// 인기 리뷰 조회(전체조회)
router.get('/', popularReview);

// 방 안에서의 리뷰 조회 params로 방 번호를 받음
router.get('/inboard/:idx', function(req, res) {
    var result = {};
    result["reviews"] = [];

    console.log(result);
    var idx = req.params.idx;


    models.Review.findAll({where: {review_boardid : idx}})
        .then(function(reviews) {
            for(var i=0; i<reviews.length; i++) {
                result["reviews"][i] = reviews[i].dataValues;
            }
            res.status(200);
            res.json(result);
        })
        .catch(function(err) {
            res.status(500);
            res.send('Something is broken!');
        });
});

// 특정 리뷰 조회
router.get('/:idx', certainReviewInfo);

// 리뷰 삭제
router.delete('/:idx', deleteReview);

// 리뷰 작성
router.post('/', regisReview);

// 리뷰 수정
router.put('/:idx', modifyReview);

// 리뷰 작성 post, body
function regisReview(req, res){
    var reviewinfo = req.body,
        result = {
        review_id : null,
        status : null,
        reason : null
        },

        res_score = null,
        res_name = null;

    models.Review.create(reviewinfo).then(function(ret){
        res_score = reviewinfo.review_score;
        res_name  = reviewinfo.review_resname;
        console.log(res_score);
        console.log(res_name);
        models.Restaurant.update({res_score: res_score},{where:{res_name : res_name}}).then(function(){
            result.review_id = ret.review_id;
            result.status = 'S';
            res.status(200).json(result);
        }, function(err){
            result.status = 'F';
            result.reason = err;
            res.status(400).json(result);
        })
    })
}

// 좋아요 한 리뷰 조회
function perferReview(req, res){
    var result = {
        review : null,
        status : null,
        reason : null
        },

        user_id = req.params.idx,
        review_id = [];

    models.Review_Response.findAll({where: {rvr_userid : user_id}}).then(function(response){
        for(var i =0; i<response.length; i++){
            review_id[i] = response[i].dataValues.rvr_reviewid;
        }
        models.Review.findAll({where: {review_id : review_id}}).then(function(review){
            if(review == null){
                result.status = 'F';
                result.reason = 'not find review';
                res.status(200).json(result);
            }
            else {
                result.review = review;
                result.status = 'S';
                res.status(200).json(result);
            }
        }, function(errOfReviewFind){
            result.status = 'F';
            result.reason = errOfReviewFind;
            res.status(400).json(result);
        })
    }, function(errOfResponse){
        result.status = 'F';
        result.reason = errOfResponse;
        res.status(400).json(result);
    })
}

// 한 식당에 대한 리뷰 조회
function resReview(req, res){
    var result = {
        review : null,
        status : null,
        reason : null
        },

        resId = req.params.idx;

    models.Review.findAll({where: {review_resid: resId}}).then(function(review){
        if(review == null){
            result.status = 'F';
            result.reason = 'not find review';
            res.status(200).json(result);
        }
        else{
            result.review = review;
            result.status = 'S';
            res.status(200).json(result);
        }
    },function(err){
        result.status = 'F';
        result.reason = err;
        res.status(400).json(result);
    })

}


//인기 리뷰 조회 get
function popularReview(req, res){
    var result = {
        reason : null,
        review : null
    };

    models.Review.sequelize.query('select * from review order by review_like desc').then(function(ret){
        if(ret == null) {
            res.status(400);
            result.status = 'F';
            result.reason = 'not find board';
            res.json(result);
        } else {
            console.log(ret[0]);
            result.status = 'S';
            result.review = ret[0];
            res.json(result);
        }
    }, function(err) {
        console.log(err);
        res.status(400);
        result.status = 'F';
        result.reason = err.message;
        res.json(result);
    })
}

// 특정 리뷰 조회 , get, params로 review_id 받음
function certainReviewInfo(req, res) {
  var idx = req.params.idx;
  var result = {};

  models.Review.findById(idx).then(function(ret) {
    if (!ret) {
      result.status = 'F';
      result.reason = 'not find review';
      res.status(400).json(result);
    } else {
      console.log(ret);
      result.status = 'S';
      result.review = ret;
      res.status(200).json(result);
    }
  }, function(err) {
    console.log(err);
    result.status = 'F';
    result.reason = err.message;
    res.status(500).json(result);
  })
}

// 리뷰 삭제 delete, params로 user_id
function deleteReview(req, res) {
  var idx = req.params.idx;
  var result = {};

  models.Review.destroy({
    where: {
      review_id: idx
    }
  }).then(function(ret) {
    console.log(ret);
    if (ret == 1) {
      result.status = 'S';
      result.review = ret;
      res.status(200).json(result);
    } else {
      result.status = 'F';
      result.reason = 'No review to delete';
      res.status(400).json(result);
    }
  }, function(err) {
    result.status = 'F';
    result.reason = err.message;
    res.status(500).json(result);
  })
}

// 리뷰 수정 put params로 review_id 받음, body로 수정 내용 받음
function modifyReview(req, res) {
  var review_id = req.params.idx;
  var reviewInfo = req.body;
  var result = {};

  models.Review.update(reviewInfo, {
    where: {
      review_id: review_id
    }
  }).then(function() {
    result.status = 'S';
    result.review_id = review_id;
    res.json(result);
  }, function(err) {
    result.status = 'F';
    result.reason = err.message;
    res.json(result);
  })
}

module.exports = router;
