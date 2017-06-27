var express      = require('express');
var path         = require('path');
var favicon      = require('serve-favicon');
var logger       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

// import routes/*.js
var index           = require('./routes/index');
var user            = require('./routes/user');
var restaurant      = require('./routes/restaurant');
var review          = require('./routes/review');
var board           = require('./routes/board');
var review_response = require('./routes/review_response');
var review_comment  = require('./routes/review_comment');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/public', express.static(path.join(__dirname, 'public')));

// route modules
app.use(function timeLog (req, res, next) {
    console.log('Time: ', Date.now())
    next()
});
app.use('/', index);
app.use('/users', user);
app.use('/restaurants', restaurant);
app.use('/reviews', review);
app.use('/boards', board);
app.use('/comments', review_comment);
app.use('/responses', review_response);

// use session
app.use(session({
  key: 'sid', // 세션키
  secret: 'secret', // 비밀키
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 // 쿠키 유효기간 1시간
  }
}));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


/**
 *  JWT(JSON Web Token)
 */
// set the secret key variable for jwt
app.set('jwt-secret', "SeCrEtKeYfOrHaShInGiNChOpChOp")
// [수정필요] 아래의 형태로 config.json에 시크릿 키를 하나 임의로 만들어서 저장해야할 것 같아요!
// app.set('jwt-secret', config.secret)

// 이후 라우터마다 토큰검증이 필요한 각 url을 아래의 형태로 작성하면, 토큰 검증을 합니다.
// const authMiddleware = require('../middlewares/auth')
// router.use('/', authMiddleware)
// ex) board.js에 아래와 같이 입력하면, 먼저 토큰 검증을 합니다.
// router.use('/:board_id', authMiddleware)

/*
// comment for using 'npm start'
app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
});
*/

module.exports = app;
