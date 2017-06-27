var express    = require('express');
var bodyParser = require('body-parser');
var multer     = require('multer');
var upload     = multer();
var router     = express.Router();
var models     = require('../models');

// 전체 방 조회
router.get('/', function(req, res) {
  var result = {};
  var data = {};
  result.boards = [];

  if('limit' in req.query) data.limit = Number(req.query.limit);
  else data.limit = 5;

  var qOrder = req.query.order=='true' ? true : false;
  var qDesc = req.query.desc=='true' ? true : false;

  if(qOrder) {
    data.order = [['board_popular']];
    if(qDesc) data.order[0].push('DESC');
  }

  models.Board.findAll(data)
    .then(function(boards) {
      for (var i = 0; i < boards.length; i++) {
        result.boards[i] = boards[i].dataValues;
      }
      res.status(200).json(result);
    }).catch(function(err) {
      // res.status(500).send('Something is broken!');
      res.status(500).send(err.message);
    });
});

// 특정 방 조회
router.get('/:idx', certainBoard);

// 방 팔로우
router.post('/follow', followBoard);

// 방 팔로우 취소
router.delete('/follow', unfollowBoard);

// // 인기 방 조회
// router.get('/popular',popularBoard);

//방 생성 한 유저당 방 하나만 생성
router.post('/', regisBoard);

// 전체 방 조회 팔로잉 되는 방 빼고
router.get('/lists/:idx', boardList);

// 팔로우 된 방 조회
router.get('/follow/:idx', specialBoard);

// 방 생성 한 유저당 방 하나만 생성
function regisBoard(req, res) {
    var boardInfo = req.body,
        user_id   = req.body.board_uid,
        result = {
            board_id : null,
            status   : null,
            reason   : null
        };

    //중복 검사
    models.Board.findAll({where: {board_uid : user_id}}).then(function(duplicate){
        if(duplicate.length != 0) {
            result.status = 'F';
            result.reason = 'Duplicate user';
            res.status(200).json(result);
        }
        else {
            models.Board.create(boardInfo).then(function (board) {
                result.board_id = board.board_id;
                result.status = 'S';
                res.status(200).json(result);
            }, function (err) {
                result.status = 'F';
                result.reason = 'not find board response' + err;
                res.status(400).json(result);
            })
        }
    })
}


// 팔로잉 된 방 빼고 전체 조회
function boardList(req, res) {
    var result = {
            board : null,
            status: null,
            reason: null
        },

        user_id = req.params.idx,
        board_id = [];

    models.Board_Follow.findAll({where: {bf_userid: user_id}}).then(function(followed){
        for(var i =0; i < followed.length; i++){
            board_id[i]= followed[i].bf_boardid;
        }
        models.Board.sequelize.query('select * from board where board_id not in (' + board_id + ') order by board_popular DESC').then(function(board){
            if(board == null){
                result.status = 'F';
                result.reason = 'not find board';
                res.status(200).json(result);
            }
            else{
                result.board  = board[0];
                result.status = 'S';
                res.status(200).json(result);
            }
        }, function(err){
            result.status = 'F';
            result.reason = 'not find board response' + err;
            res.status(400).json(result);
        })
    })
}

// 특정 방 조회 get, board_id params로 받음
function certainBoard(req, res){
    var idx = req.params.idx;
    var result = {
        status : null,
        reason : null,
        board  : null
    };
    models.Board.findById(idx).then(function(ret) {
        if(ret == null){
            result.status = 'F';
            result.reason = 'not find board';
            res.status(200).json(result);
        } else{
            result.status = 'S';
            result.board = ret;
            res.status(200).json(result);
        }
    }, function(err) {
        result.status = 'F';
        result.reason = 'not find board response' + err.message;
        res.status(400).json(result);
    })
}

// 인기 방 조회 get, 3개
function popularBoard(req, res){
    var result = {
        reason : null,
        board : null
    };

    models.Board.sequelize.query('select * from board order by board_popular desc limit 3;').then(function(ret){
        if(ret == null) {
            result.status = 'F';
            result.reason = 'not find board';
            res.status(200).json(result);
        } else {
            result.status = 'S';
            result.board = ret[0];
            res.status(200).json(result);
        }
    }, function(err) {
        result.status = 'F';
        result.reason = 'not find board response' + err.message;
        res.status(400).json(result);
    })
}


// // 방 팔로우 put, bf_userid, bf_boardid body로 받음
function followBoard(req, res){
    var bfinfo = req.body,

        result = {
            board_id : null,
            status   : null,
            reason   : null
        },

        preventDuplication = {
            bf_userid  : bfinfo.bf_userid,
            bf_boardid : bfinfo.bf_boardid
        },

        boardIdMatched = {
            board_id : bfinfo.bf_boardid
        },

        value = {
            board_popular : 0
        };

    models.Board_Follow.findAll({where:preventDuplication})
    .then(function (response) {
        // 리스폰스 중복방지
        if(response.length > 0) {
            result.status = 'F';
            result.reason = 'Duplicate follow';
            res.status(200).json(result);
        }
        else{
            models.Board_Follow.create(bfinfo)
            models.Board.findAll({where: boardIdMatched}).then(function(board){
                value.board_popular = board[0].dataValues.board_popular + 1;
                models.Board.update(value, {where:boardIdMatched}).then(function() {
                    result.board_id = bfinfo.bf_boardid;
                    result.status   = 'S';
                    res.status(200).json(result);
                }, function (err) {
                    result.status = 'F';
                    result.reason = 'not find board response' + err;
                    res.status(400).json(result);
                })
            })
        }
    }, function(err1) {
        console.log(err1);
        result.status = 'F';
        result.reason = 'Follow failed';
        res.status(400).json(result);
    })
}

// 방 팔로우 취소 put, bf_userid, bf_boardid body로 받음
function unfollowBoard(req, res){
    var bfinfo = req.body,

        result = {
            board_id : null,
            status   : null,
            reason   : null
        },

        preventDuplication = {
            bf_userid  : bfinfo.bf_userid,
            bf_boardid : bfinfo.bf_boardid
        },

        boardIdMatched = {
            board_id : bfinfo.bf_boardid
        },

        value = {
            board_popular : 0
        },

        destroyCondition = {
            bf_boardid: bfinfo.bf_boardid
        }


    models.Board_Follow.findAll({where:preventDuplication}).then(function (response) {
        // 리스폰스 중복방지
        if(response.length == 0) {
            result.status = 'F';
            result.reason = 'Duplicate follow';
            res.status(200).json(result);
        }
        else{
            models.Board_Follow.destroy({where: destroyCondition})
            models.Board.findAll({where: boardIdMatched}).then(function(board){
                value.board_popular = board[0].dataValues.board_popular - 1;
                models.Board.update(value, {where: boardIdMatched}).then(function() {
                    result.board_id = bfinfo.bf_boardid;
                    result.status   = 'S';
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

// 팔로우 된 방 조회 params로 userid 받음
function specialBoard(req, res){
    var result   = {},
        board_id = [],
        user_id  = req.params.idx;

    models.Board_Follow.findAll({where : {bf_userid : user_id}})
    .then(function(boardF){
        for(var i = 0; i < boardF.length; i++){
            board_id[i] = boardF[i].bf_boardid;
        }
        models.Board.findAll({where : {board_id: board_id} })
        .then(function(board){
            if(board.length == 0) {
                result.status = 'F';
                result.reason = 'not find board';
                res.status(200).json(result);
            } else {
                result.status = 'S';
                result.board  = board;
                res.status(200).json(result);
            }
        }, function(errOfBoardFind) {
            result.status = 'F';
            result.reason = "Failed check board" + errOfBoardFind;
            res.status(400).json(result);
        })
    }, function(errOfBoardFollow){
        result.status = 'F';
        result.reason = "Failed check board_follow" +  errOfBoardFollow;
        res.status(400).json(result);
    });
}

module.exports = router;
