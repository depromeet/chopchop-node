const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const models = require('../models');

// const Users = require('./user');
module.exports = () => {
  passport.serializeUser((user, done) => { // Strategy 성공 시 호출됨
    done(null, user); // 여기의 user가 deserializeUser의 첫 번째 매개변수로 이동
  });

  passport.deserializeUser((user, done) => { // 매개변수 user는 serializeUser의 done의 인자 user를 받은 것
    done(null, user);
  });

  passport.use(new LocalStrategy({ // local 전략을 세움
    usernameField: 'id',
    passwordField: 'pw',
    // session: true, // 세션에 저장 여부
    // passReqToCallback: false,
  }, (id, pw, done) => {
    console.log('id:', id, 'pw:', pw);
    models.User.findAll({where: {user_email: id}})
    .then((user) => {
      console.log('user:', user.dataValues);
      if (!user)
        done(null, false, { message: '존재하지 않는 아이디입니다' }); // 임의 에러 처리
      else if(user.dataValues.user_password == pw) {             // 검증 성공
        done(null, user);
      }
      else {
        done(null, false, { message: '비밀번호가 틀렸습니다' });  // 임의 에러 처리
      }
    })
    .catch((err) => {
      done(err, false);
    });
  }));
};

exports.passport = passport;
