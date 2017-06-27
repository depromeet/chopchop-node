var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();
var router = express.Router();
var models = require('../models');

// 댓글 작성
router.post('/', regisComment);

/**
 *  GET /comments?limit={%d}&offset={%d}
 *  댓글 읽어오기
 */
router.get('/', function(req, res) {
  var result = {};
  var data = {};
  data.where = {};
  if ('limit' in req.query) data.limit = Number(req.query.limit);
  if ('offset' in req.query) data.offset = Number(req.query.offset);
  if ('id' in req.query) data.where.rc_id = req.query.id;
  if ('user_id' in req.query) data.where.rc_userid = req.query.user_id;
  if ('review_id' in req.query) data.where.rc_reviewid = req.query.review_id;
  // data.attributes = ['rc_id', 'rc_userid', 'rc_reviewid', 'rc_comment'];

  models.Review_Comment.findAll(data)
  .then(function(comments) {
    if (!comments)
      res.status(400).send('not found');
    result.comments = []
    for (var i = 0; i < comments.length; i++) {
      result.comments[i] = comments[i];
    }
    res.status(200).json(result);
  }).catch(function(err) {
    res.status(500).send(err.message);
  });
});

// 댓글 조회
router.get('/:idx', function(req, res) {
  var result = {};
  var review_id = req.params.idx;

  models.Review_Comment.findById(review_id)
  .then(function(review) {
    if (!review) res.status(400).send('not found');
    res.status(200).json(review);
  }).catch(function(err) {
    res.status(500).send(err.message);
  });
});

// 댓글 수정
router.put('/:idx', modifyComment);

// 댓글 삭제
router.delete('/:idx', deleteComment);

// 댓글 작성, body로 rc_reviewid, rc_userid 받음
function regisComment(req, res){
    var commentInfo = req.body,
        result = {
            rc_id  : null,
            status : null,
            reason : null
        },

        value = {
            review_comment : 0
        },

        reviewIdMatched = {
            review_id: commentInfo.rc_reviewid
        };

    models.Review_Comment.create(commentInfo).then(function(ret){
        models.Review.findAll({where: reviewIdMatched}).then(function(comment){
            value.review_comment = comment[0].dataValues.review_comment + 1;

            models.Review.update(value, {where: reviewIdMatched}).then(function () {
                result.rc_id = ret.rc_id;
                result.status = 'S';
                res.status(200).json(result);
            }, function (err) {
                result.status = 'F';
                result.reason = err;
                res.status(400).json(result);
            })
        })
    });
}

// 댓글 수정 params로 댓글 아이디 입력받음
function modifyComment(req, res) {
  var rc_id = req.params.idx;
  var rcinfo = req.body;
  var result = {
    rc_id: null,
    status: null,
    reason: null
  };

  models.Review_Comment.update(rcinfo, {
    where: {
      rc_id: rc_id
    }
  }).then(function() {
    result.status = 'S';
    result.rc_id = rc_id;
    res.status(200).json(result);
  }, function(err) {
    result.status = 'F';
    result.reason = err.message;
    res.status(400).json(result);
  });
}

// 댓글 삭제, params로 rc_id 받음
function deleteComment(req, res){
    var rc_id = req.params.idx,
        result = {
            status : null,
            reason : null
        },

        value = {
            review_comment : 0
        },

        review_id = 0;

    models.Review_Comment.findById(rc_id).then(function(comment){
        review_id = comment.dataValues.rc_reviewid;
        models.Review.findById(review_id).then(function(review){
            value.review_comment = review.dataValues.review_comment - 1;
            models.Review.update(value,{where:{review_id: review_id}});
            models.Review_Comment.destroy({where: {rc_id : rc_id}}).then(function(ret) {
                if(ret == 1) {
                    result.status = 'S';
                    res.json(result);
                }
                else {
                    res.status(400);
                    result.status = 'F';
                    result.reason = 'No review to delete';
                    res.json(result);
                }
            }, function(err) {
                console.log(err);
                result.status = 'F';
                result.reason = err.message;
                res.json(result);
            })
        });
    });
}

module.exports = router;

