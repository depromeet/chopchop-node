var aws = require('aws-sdk');
var config = require('../config/config.json').development;

var AWS_ACCESS_KEY = config.AWS_ACCESS_KEY;
var AWS_SECRET_KEY = config.AWS_SECRET_KEY;
var S3_BUCKET = config.S3_BUCKET;

aws.config.update({
  accessKeyId     : AWS_ACCESS_KEY, 
  secretAccessKey : AWS_SECRET_KEY
});
/*
*/
module.exports = aws;

