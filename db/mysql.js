var config = require('./../config/config.json');
var mysql = require('mysql');

var pool = mysql.createPool({
	connectionLimit : 10, 
	host : config.db_host, 
	port : config.db_port, 
	user : config.db_user, 
	password : config.db_password, 
	database : config.db_name
});

module.exports = pool;
