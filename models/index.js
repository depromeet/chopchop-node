var fs = require('fs');
var path = require('path');
var Sequelize = require('sequelize');

// cofig파일에서 dbConfig속성을 불러온다
// var env = process.env.NODE_ENV || "dbConfig";
// var DBInit= require('../config.json')[env];
var config = require('./../config/config.json').development;

//시퀄라이즈 생성
var sequelize = new Sequelize(config.database, config.username, config.password, {
	dialect : config.dialect,
	host : config.host,
	port : config.port,
	pool : config.pool,
	define : {
		charset : 'utf8',
		collate : 'utf8_general_ci'
	}
});

//다른 모델들을 저장하는 객체.
var db = {};

//fs모듈로 디렉토리에 있는 파일을 모두 읽어 db객체에 삽입한다.
fs.readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== 'index.js');
  })
  .forEach(function(file) {
    var model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model;
  });

// models 폴더가 module 이 됨.
Object.keys(db).forEach(function(modelName) {
  if ("associate" in db[modelName]) {
    db[modelName].associate(db);
  }
});

//db 객체에 sequelize 모듈과 초기화 설정을 저장.
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
