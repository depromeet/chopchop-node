var express = require('express');
var bodyParser = require('body-parser');
var multer     = require('multer');
var upload     = multer();
var router     = express.Router();
var models     = require('../models');

// 식당 등록
router.post('/', regisRestaurant);

// 전체 식당 조회
router.get('/', restaurantsList);

// 특정 식당 조회
router.get('/:res_id', certainRestaurants);

// // 별점 조회
// router.get('/score/:res_id', restaurantsScore);

// 식당 정보 수정
router.put('/:res_id', modifyRestaurant);

// 식당 정보 삭제
router.delete('/:res_id', deleteRestaurant);

//식당 팔로우
router.post('/follow',followRes);

//식당 팔로우 취소
router.delete('/follow',unfollowRes);

// 팔로우 한 식당 조회
router.get('/follow/:idx', specialRes);

//식당 검색
router.get('/search/:keyword', searchResByname);

// 식당 등록
function regisRestaurant(req, res){
  var result = {};
  var data = req.body;

  models.Restaurant.create(data).then(function(restaurant) {
    result["res_id"] = restaurant.res_id;
    res.status(200);
    res.json(result);
  })
  .catch(function(err) {
    res.status(500).send('Something is broken!');
  });
}

// 전체 식당 조회
function restaurantsList(req, res){
  var result = {};
  result.values = [];

  models.Restaurant.findAll().then(function(restaurants) {
    for(var i=0; i<restaurants.length; i++) {
      result.values[i] = restaurants[i];
    }
    res.status(200).json(result);
  })
  .catch(function(err) {
    res.status(500).send(err.message);
  });
}

// 특정 식당 조회
function certainRestaurants(req, res){
  var result = {};

  models.Restaurant.findById(pResID)
      .then(function(restaurants) {
        if(restaurants == null){
          res.status(400).send('There is no restaurants');
        } else {
            result["res_id"] = restaurants.res_id;
            result["res_name"] = restaurants.res_name;
            result["res_img"] = restaurants.res_img;
            result["res_freenote"] = restaurants.res_freenote;
            result["res_address"] = restaurants.res_address;
            result["res_score"] = restaurants.res_score;
            result["res_popular"] = restaurants.res_popular;
            result["res_phonenum"] = restaurants.res_phonenum;
            result["res_latitude"] = restaurants.res_latitude;
            result["res_longtitude"] = restaurants.res_longtitude;
            result["res_style"] = restaurants.res_style;

            res.status(200).json(result);
        }
      })
      .catch(function(err) {
          res.status(500).send('Something is broken!');
      });
}

// 식당 별점 조회
function restaurantsScore(req, res){
  var result = {},
      pResID = req.params.res_id;

  models.Restaurant.findById(pResID).then(function(restaurants){
      if(restaurants == null){
          res.status(200).send('There is no restaurants');
      }
      else{
          result.status = 'S';
          result.score = restaurants.res_score;
          res.status(200).json(result);
      }
  }, function(err){
      result.status = 'F';
      result.reason = err;
      res.status(400).json(result);
  })
}

// 식당 정보 수정
function modifyRestaurant(req, res){
  var result  = {};
  var pResID  = req.params.res_id;
  var resInfo = req.body;

  models.Restaurant.findAll({where: {res_id : pResID}}).then(function(restaurant){
    if(restaurant.length == 0){
      result.status = 'F';
      result.reason = 'not find restaurant';
      res.status(200).json(result);
    }
    else{
      models.Restaurant.update(resInfo,{where : {res_id : pResID}}).then(function(){
        result["res_id"] = pResID;
        result.status = 'S';
        res.status(200).json(result);
      })
      .catch(function(err){
        res.status(500).send('Something is broken!');
      });
    }
  })
}

// 식당 정보 삭제
function deleteRestaurant(req, res) {
  var result = {};
  var pResId = req.params.res_id;

  models.Restaurant.destroy({where: {res_id : pResId}})
      .then(function(restaurant){
        if(restaurant == null){
          res.status(200).send('There is no restaurant');
        }else{
          result["res_id"] = pResId;
          res.status(200).json(result);
        }
      }).catch(function(err){
        res.status(500).send('response error');
  })
}

// 식당 팔로우
function followRes(req, res){
    var rfInfo = req.body,
        result = {
            res_id : null,
            status   : null,
            reason   : null
        },

        preventDuplication = {
            rf_userid  : rfInfo.rf_userid,
            rf_resid   : rfInfo.rf_resid
        },

        resIdMatched = {
            res_id : rfInfo.rf_resid
        },

        value = {
            res_popular : 0
        };

    models.Restaurant_Follow.findAll({where:preventDuplication}).then(function (response) {

        // 리스폰스 중복방지
        if(response.length > 0) {
            result.status = 'F';
            result.reason = 'Duplicate follow';
            res.status(200).json(result);
        }
        else{
            models.Restaurant_Follow.create(rfInfo);
            models.Restaurant.findAll({where: resIdMatched}).then(function(restaurant){
                value.res_popular = restaurant[0].dataValues.res_popular + 1;
                models.Restaurant.update(value, {where:resIdMatched}).then(function() {
                    result.res_id = rfInfo.rf_resid;
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

// 식당 팔로우 취소
function unfollowRes(req, res){
    var rfInfo = req.body,
        result = {
            res_id : null,
            status   : null,
            reason   : null
        },

        preventDuplication = {
            rf_userid  : rfInfo.rf_userid,
            rf_resid   : rfInfo.rf_resid
        },

        resIdMatched = {
            res_id : rfInfo.rf_resid
        },

        value = {
            res_popular : 0
        },

        destoryCondition = {
          rf_resid: rfInfo.rf_resid
        }


    models.Restaurant_Follow.findAll({where:preventDuplication}).then(function (response) {
        // 리스폰스 중복방지
        if(response.length == 0) {
            result.status = 'F';
            result.reason = 'Duplicate follow';
            res.status(200).json(result);
        }
        else{
            models.Restaurant_Follow.destroy({where: destoryCondition});
            models.Restaurant.findAll({where: resIdMatched}).then(function(restaurant){
                value.res_popular = restaurant[0].dataValues.res_popular - 1;
                models.Restaurant.update(value, {where:resIdMatched}).then(function() {
                    result.res_id = rfInfo.rf_resid;
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

//해당 유저의 팔로우 한 식당 조회
function specialRes(req, res){
  var result = {},
      res_id = [];
      user_id = req.params.idx;

  models.Restaurant_Follow.findAll({where : {rf_userid : user_id}}).then(function(resF){
      for(var i = 0; i < resF.length; i++){
          res_id[i] = resF[i].rf_resid;
      }
      models.Restaurant.findAll({where : {res_id: res_id} }).then(function(restaurant){
          if(restaurant.length == 0) {
              result.status = 'F';
              result.reason = 'not find restaurant';
              res.status(200).json(result);
          } else {
              result.status = 'S';
              result.restaurant  = restaurant;
              res.status(200).json(result);
          }
      }, function(errOfRestaurantFind) {
          result.status = 'F';
          result.reason = "Failed check board" + errOfRestaurantFind;
          res.status(400).json(result);
      })
  }, function(errOfRestaurantFollow){
      result.status = 'F';
      result.reason = "Failed check board_follow" + errOfRestaurantFollow;
      res.status(400).json(result);
  })
}

//식당 검색
function searchResByname(req, res){

  var keyword = req.params.keyword,
      condition = {
        res_name    : keyword,
        res_address : keyword
      },
      result = {};

  models.Restaurant.sequelize.query(' select * from restaurant where res_name LIKE "%' + keyword + '%" or res_address LIKE"%' + keyword + '%" ').then(function(restaurant){
    if(restaurant.length == 0){
      result.status = 'F';
      result.reason = 'not find restaurant';
      res.status(200).json(result);
    }
    else{
      result.restaurant = restaurant[0];
      result.status = 'S';
      res.status(200).json(result);
    }
  }, function(errOfRestaurantFind){
    result.status = 'F';
    result.reason = errOfRestaurantFind;
    res.status(400).json(result);
  })
}

module.exports = router;
