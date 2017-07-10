var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();
var router = express.Router();
var models = require('../models');
var async = require('async');
const _ = require('lodash');

// 리뷰 검색
// 특정 유저가 좋아요 한 리뷰
// 특정 식당에 대한 리뷰
// 특정 보드의 리뷰
// 특정 리뷰 조회
// 인기 리뷰 조회 (인기 순 정렬)
router.get('/', findAll);
router.get('/:review_id', findAll);

// 리뷰 삭제
router.delete('/:idx', deleteReview);

// 리뷰 작성
router.post('/', regisReview);

// 리뷰 수정
router.put('/:idx', modifyReview);

// 리뷰 작성 post, body
function regisReview(req, res) {
  let reviewinfo = req.body;
  let result = {
    review_id : null,
    status : null,
    reason : null
  };
  let res_score = null;
  let res_name = null;

  models.Review.create(reviewinfo)
  .then((ret) => {
    res_score = reviewinfo.review_score;
    res_name  = reviewinfo.review_resname;
    models.Restaurant.update({res_score: res_score}, {where:{res_name : res_name}})
    .then(() => {
      result.review_id = ret.review_id;
      result.status = 'S';
      res.status(200).json(result);
    }, (err) => {
      result.status = 'F';
      result.reason = err;
      res.status(400).json(result);
    });
  });
}

// 리뷰 삭제 delete, params로 user_id
function deleteReview(req, res) {
  var idx = req.params.idx;
  var result = {};

  models.Review.destroy({ where: { review_id: idx }})
  .then((ret) => {
    console.log(ret);
    if (ret == 1) {
      result.status = 'S';
      result.review = ret;
      res.status(200).json(result);
    } else {
      result.status = 'F';
      result.reason = 'No review to delete';
      res.status(200).json(result);
    }
  }, (err) => {
    result.status = 'F';
    result.reason = err.message;
    res.status(500).json(result);
  });
}

// 리뷰 수정 put params로 review_id 받음, body로 수정 내용 받음
function modifyReview(req, res) {
  let review_id = req.params.idx;
  let reviewInfo = req.body;
  let result = {};

  models.Review.update(reviewInfo, {where: {review_id: review_id}})
  .then(() => {
    result.status = 'S';
    result.review_id = review_id;
    res.json(result);
  }, (err) => {
    result.status = 'F';
    result.reason = err.message;
    res.json(result);
  });
}

function findAll(req, res) {
  let data = {};
  data.where = {};
  // TODO : validate data


  // TODO : set default value
  data.limit = 10;


  // dynamic parameter
  if('review_id' in req.params) data.where.review_id = Number(req.params.review_id);

  // query string
  if('popular' in req.query) data.order = 'review_like DESC';

  if('offset' in req.query) data.offset = Number(req.query.offset);
  if('limit' in req.query) data.limit = Number(req.query.limit);
  if('user_id' in req.query) data.where.review_uid = Number(req.query.user_id);
  if('board_id' in req.query) data.where.review_boardid = Number(req.query.board_id);
  if('res_id' in req.query) data.where.review_resid = Number(req.query.res_id);

  models.Review.findAll(data)
    .then((reviews) => {
      if(reviews)
        return reviews;
      res.status(200).json({
        status: 'Failure',
        message: 'Not found.',
      });
      return;
    })
    .then((reviews) => {
      if(!('board_name' in req.query)) {
        return ({ reviews });
      }
      return new Promise((resolve, reject) => {
      models.Board.findAll({ where: { board_name : { like: '%' + req.query.board_name + '%' }}})
        .then((boards) => {
          let bIds = [];
          _.forEach(boards, (board) => {
            bIds.push(board.dataValues.board_id);
          });
          let ret = [];
          _.forEach(reviews, (review) => {
            if(bIds.indexOf(review.review_boardid) !== -1) {
              ret.push(review);
            }
          });
          resolve({ reviews: ret });
        })
        .catch((err) => {
          reject({ err: 'board' });
        });
      });
    })
    .then(({ reviews }) => new Promise((resolve, reject) => {
      async.map(reviews, (review, callback) => {
        models.User.findById(review.review_uid)
        .then(user => {
          review.review_username = '유저 이름';
          review.review_nickname = '유저 별명';
          review.dataValues.review_userimage = '유저 이미지';
          if(user) {
            review.review_username = user.user_name;
            review.review_nickname = user.user_nickname;
            review.dataValues.review_userimage = user.user_image;
          }
          callback(null, review);
        })
        .catch(err => { callback(err, review); });
      }, (err, results) => {
        if(err) {
          reject({ err: 'review' });
        } else {
          resolve({ reviews: results });
        }
      });
    }))
    .then(({ reviews }) => new Promise((resolve, reject) => {
      async.map(reviews, (review, callback) => {
        console.log('review_boardid:', review.review_boardid);
        models.Board.findById(review.review_boardid)
          .then((board) => {
            review.dataValues.review_boardname = '방 이름';
            if(board) {
              review.dataValues.review_boardname = board.board_name;
            }
            callback(null, review);
          })
          .catch(err => { callback(err, review); });
      }, (err, results) => {
        if(err) {
          reject({ err: 'board' });
        } else {
          resolve({ reviews: results });
        }
      });
    }))
    .then(({ reviews }) => new Promise((resolve, reject) => {
      async.map(reviews, (review, callback) => {
        models.Restaurant.findById(review.review_resid)
          .then((restaurant) => {
            review.review_resname = '식당 이름';
            review.review_resadd  = '식당 주소';
            if(restaurant) {
              review.review_resname = restaurant.res_name;
              review.review_resadd = restaurant.res_address;
            }
            callback(null, review);
          })
          .catch(err => { callback(err, review); });
      }, (err, results) => {
        if(err) {
          reject({ err: 'restaurant' });
        } else {
          resolve({ reviews: results });
        }
      });
    }))
    .then(({ reviews }) => {
      res.status(200).json({
        status: 'Success',
        message: 'Found.',
        values: reviews,
      });
    })
    .catch(({ err }) => {
      res.status(500).json({
        status: 'Error',
        message: err,
      });
    });
}

module.exports = router;
