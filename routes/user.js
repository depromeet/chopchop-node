var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();
var router = express.Router();
var models = require('../models');
var jwt = require('jsonwebtoken');
var aws = require('../aws/storage');

/**
 *  GET /users?limit={%d}&offset={%d}
 *  list N users ['user_id', 'user_name', 'user_nickname', 'user_image']
 */
router.get('/', function(req, res) {
  var data = {};
  data.where = {};
  data.attributes = ['user_id', 'user_name', 'user_email', 'user_password', 'user_nickname', 'user_image'];

  if('limit' in req.query) data.limit = Number(req.query.limit);
  if('offset' in req.query) data.offset = Number(req.query.offset);
  if('id' in req.query) data.where.user_id = req.query.id;
  if('email' in req.query) data.where.user_email = req.query.email;
  if('nickname' in req.query) data.where.user_nickname = req.query.nickname;

  var result = {};
  result.users = [];

  models.User.findAll(data)
    .then(function(users) {
      if(!users)
        res.status(200).send('not found');

      for (var i = 0; i < users.length; i++) {
        result.users[i] = users[i];
      }
      res.status(200).json(result);
    })
    .catch(function(err) {
      // handle error;
      if (err) {
        res.status(500).send(err.message);
      }
    });
});

/**
 *  GET /users/email?email={user_email}
 */
router.get('/email', function(req, res) {
  if (!req.query.email) {
    res.status(412).json({
      message: "Precondition Failed"
    });
  } else {
    var qEmail = req.query.email;
  }

  models.User.findOne({
      where: {
        user_email: qEmail
      }
    })
    .then(function(user) {
      console.log(user.dataValues);

      if (!user) {
        res.status(200).json({
          message: 'success'
        });
      } else {
        // TODO : replace status code to right value
        res.status(400).json({
          message: 'failure'
        });
      }
    })
    .catch(function(err) {
      res.status(500).json({
        message: 'error : find ~ catch'
      });
    });
});

/**
 *  POST /users
 */
router.post('/', function(req, res) {
  // TODO : require user_image

  var data = req.body.user;
  var result = {};

  // add user except image
  models.User.create(data)
    .then(function(user) {
      result["message"] = 'success';
      res.status(200).json(result);
    })
    .catch(function(err) {
      result["message"] = 'failure';
      res.status(500).json(err.message);
    });
  /*
    return models.sequelize.transaction(function (t) {
      // chain all your queries here. make sure you return them.
      return models.User.create(data, {transaction: t})
      .then(function (user) {
        var fileType = 'png';
        var addressOfImage = '/users/' + user.user_id + '.' + fileType;

        return user.update({
          user_image : addressOfImage
        },
        {
          where : {
            user_id : user.user_id
          }
        }, {transaction: t});
      });
    }).then(function (result) {
      console.log(result);
      // Transaction has been committed
      // result is whatever the result of the promise chain returned to the transaction callback
      res.status(200);
      res.send('transaction success');
    }).catch(function (err) {
      // Transaction has been rolled back
      // err is whatever rejected the promise chain returned to the transaction callback
      res.status(500);
      res.send('transaction failure');
    });
    */
});

/**
 *  POST /users/login
 */
router.post('/login', function(req, res) {
  var sess = req.session;
  var email = req.body.email;
  var password = req.body.password;

  var result = {};

  const secret = req.app.get('jwt-secret');
  models.User.find({
      attributes: ['user_id', 'user_name', 'user_email', 'user_password'],
      where: {
        user_email: email
      }
    })
    .then(function(user) {
      // username is not found
      if (!user) {
        throw 'not found';
      }
      // username is found && password is correct
      if (user.user_password == password) {

        jwt.sign({
            id: user.user_id,
            name: user.user_name
          },
          secret, {
            expiresIn: '7d',
            issuer: 'chopchoping.com',
            subject: 'userInfo'
          }, (err, token) => {
            //token
            result["token"] = token;
            result["message"] = 'login success';
            res.status(200);
            res.json(result);
          });
      }
      // username is found && password is not correct
      else {
        throw 'not correct';
      }
    })
    .catch(function(err) {
      if (err == 'not found') {
        res.status(412).json({
          message: 'ID is not found'
        });
      } else if (err == 'not correct') {
        res.status(412).json({
          message: 'Password is not correct'
        });
      } else {
        res.status(500).json({
          message: 'Server Error'
        });
      }
    });
});

/**
 *  POST /users/logout
 */
router.post('/logout', function(req, res) {
  // TODO : delete session
  res.status(200).send('POST /user/logout');
});

/**
 *  PUT /users/{user_id}
 */
router.put('/', function(req, res) {
  // 'UPDATE tbl_user SET ? WHERE user_id= ?'
  res.status(200).send('PUT /user/{user_id}');
});

/**
 *  DELETE /users/{user_id}
 */
router.delete('/', function(req, res) {
  // 'DELETE FROM tbl_user WHERE user_id = ?'
  res.status(200).send('DELETE /user/{user_id}');
});

module.exports = router;
