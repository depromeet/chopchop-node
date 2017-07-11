const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const models = require('./../models');
const config = require('./../config/config.json').development;

// passport
passport.serializeUser((user, done) => { // Strategy 성공 시 호출됨
  console.log('serialize:', user);
  done(null, user); // 여기의 user가 deserializeUser의 첫 번째 매개변수로 이동
});

passport.deserializeUser((user, done) => { // 매개변수 user는 serializeUser의 done의 인자 user를 받은 것
  console.log('deserialize:', user);
  done(null, user);
});

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password', 
  }, (username, password, done) => {
    models.User.findOne({where: {user_email: username}})
      .then((user) => {
        if (!user) {
          done(null, false, { message: '존재하지 않는 아이디입니다' }); // 임의 에러 처리
        }
        else if(user.dataValues.user_password === password) {             // 검증 성공
          done(null, user.dataValues);
        }
        else {
          done(null, false, { message: '비밀번호가 틀렸습니다' });  // 임의 에러 처리
        }
      })
      .catch((err) => {
        done(err, false);
      });
}));

passport.use(new FacebookStrategy({
    clientID: config.FACEBOOK_TEST_APP_ID,
    clientSecret: config.FACEBOOK_TEST_APP_SECRET,
    callbackURL: 'http://www.example.com/auth/facebook/callback',
  }, (accessToken, refreshToken, profile, done) => {
    let user = {
      user_id: 'user_id',
      message: 'hello world!',
    };
    done(null, user);
  }));
  // function(accessToken, refreshToken, profile, done) {
  //   User.findOrCreate(..., function(err, user) {
  //     if (err) { return done(err); }
  //     done(null, user);
  //   });
  // }

module.exports = passport;
