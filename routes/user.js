var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();
var router = express.Router();
var models = require('../models');
var jwt = require('jsonwebtoken');
var aws = require('../aws/storage');
var passport = require('passport');

/**
 *  GET /users?limit={%d}&offset={%d}
 *  list N users ['user_id', 'user_name', 'user_nickname', 'user_image']
 */
router.get('/', (req, res) => {
  if('email' in req.query) {
    checkEmail(req, res);
  }
  else {
    getUsers(req, res);
  }
});

/**
 *  GET /users
 */
router.get('/:id', (req, res) => {
  console.log('get /users/', req.params.id);
  getUsers(req, res, req.params.id);
});


/**
 *  POST /users
 */
router.post('/', (req, res) => {
  // TODO : require user_image
  let data = {};
  data.user_tokenid = req.body.tokenid;
  data.user_email = req.body.email;
  data.user_password = req.body.password;
  data.user_name = req.body.name;
  data.user_nickname = req.body.nickname;
  data.user_source = req.body.source;

  models.User.find({where: {user_email: req.body.email}})
    .then((result) => {
      if(Object.keys(result.dataValues).length > 0) {
        res.status(200).json({
          status: 'Failure',
          message: 'Email already taken. Please try another one'
        });
      }
      else {
        // add user except image
        models.User.create(data)
          .then((user) => {
            res.status(200).json({
              status: 'Success',
              message: 'Signed up successfully.',
              values: { user_id: user.dataValues.user_id }
            });
          });
      }
    })
    .catch((err) => {
      res.status(500).json({
        status: 'Error',
        message: err.message
      });
    });
});

/**
 *  POST /users/login
 */
router.post('/login', (req, res) => {
  let sess = req.session;
  let email = req.body.email;
  let password = req.body.password;
  let result = {};
  const secret = req.app.get('jwt-secret');

  models.User.find({
    attributes: ['user_id', 'user_name', 'user_nickname', 'user_email'],
    where: { user_email: email }
  })
  .then((users) => {
    // username is not found
    if (!users) {
      throw 'not found';
    }
    // username is found && password is correct
    if (users.user_password == password) {

      jwt.sign({
        id: users.user_id,
        name: users.user_name
      },
      secret, {
        expiresIn: '7d',
        issuer: 'chopchoping.com',
        subject: 'userInfo'
      }, (err, token) => {
        //token
        res.status(200);
        res.json({
          status: 'Success',
          message: 'login success',
          values: { token: token }
        });
      });
    }
    // username is found && password is not correct
    else {
      throw 'not correct';
    }
  })
  .catch((err) => {
    if (err == 'not found') {
      res.status(412).json({
        status: 'Failure',
        message: 'Email is not found.'
      });
    } else if (err == 'not correct') {
      res.status(412).json({
        status: 'Failure',
        message: 'Password is not correct.'
      });
    } else {
      res.status(500).json({
        status: 'Error',
        message: err.message
      });
    }
  });
});


/**
 *  POST /users/logout
 */
router.post('/logout', (req, res) => {
  // TODO : delete session
  res.status(200).send('POST /user/logout');
});


/**
 *  PUT /users/{user_id}
 */
router.put('/', (req, res) => {
  // 'UPDATE tbl_user SET ? WHERE user_id= ?'
  res.status(200).send('PUT /user/{user_id}');
});


/**
 *  DELETE /users/{user_id}
 */
router.delete('/', (req, res) => {
  // 'DELETE FROM tbl_user WHERE user_id = ?'
  res.status(200).send('DELETE /user/{user_id}');
});

/**
 *  POST /users/loginpp
 */
router.post('/loginpp', passport.authenticate('local', {
  failureRedirect: '/',
}), (req, res) => {
  res.status(200).json({
    status: 'Success',
    message: 'Login successfully',
  });
});

router.get('/loginpp/1', (req, res) => {
  models.User.find({ limit: 10 })
    .then((user) => {
      console.log(user.dataValues);
      return console.log(setTimeout(function(){ console.log("Hello"); }, 3000));
    })
    .then(() => {
      res.status(200).send('hi');
    })
    .catch((err) => {
      console.log(err);
    });


});

function getUsers(req, res, user_id=null) {
  console.log('data');
  let data = {};
  data.where = {};
  data.attributes = ['user_id', 'user_name', 'user_email', 'user_nickname', 'user_image'];

  data.limit = 10;

  if('limit' in req.query) data.limit = Number(req.query.limit);
  if('offset' in req.query) data.offset = Number(req.query.offset);
  if(user_id != null) data.where.user_id = user_id;
  if('nickname' in req.query) data.where.user_nickname = req.query.nickname;

  console.log('result');
  let results = [];

  models.User.findAll(data)
  .then((users) => {
    console.log(users);
    if(users.length == 0) {
      res.status(200).json({
        status: 'Success',
        message: 'Not found.'
      });
    }
    for (var i=0; i<users.length; i++) {
      results[i] = users[i];
    }
    console.log('results:', results);

    res.status(200).json({
      status: 'Success',
      message: 'Found.',
      values: results
    });
  })
  .catch((err) => {
    res.status(500).json({
      status: 'Error',
      message: err.message
    });
  });
}

function checkEmail(req, res) {
  if (!req.query.email) {
    res.status(412).json({
      status: 'Failure',
      message: "Precondition Failed"
    });
  }
  models.User.findOne({ where: {user_email: req.query.email} })
  .then((user) => {
    if (!user) {
      res.status(200).json({
        status: 'Success',
        message: 'Email is available.'
      });
    } else {
      res.status(200).json({
        status: 'Failure',
        message: 'Email already taken. Please try another one.'
      });
    }
  })
  .catch((err) =>{
    res.status(500).json({
      status: 'Error',
      message: err.message
    });
  });
}

module.exports = router;
