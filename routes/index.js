var express = require('express');
var router = express.Router();
var aws = require('aws-sdk');
var config = require('../config/config.json').development;

/* GET home page. */
router.get('/', function(req, res) {
  console.log('/routes/index.js');
  //res.render('index', { title: 'Express' });

  console.log('aws.config.update');
  aws.config.update({
    accessKeyId     : config.aws_access_key, 
    secretAccessKey : config.aws_secret_key
  });

  // text for aws s3
  console.log('s3 = new aws.S3');
  var s3 = new aws.S3({
    endpoint: 's3-website.ap-northeast-2.amazonaws.com',
    signatureVersion: 'v4',
    region: 'Seoul'
  });
  var options = {
    Bucket : "chopchopstorage", 
    Key    : "sample" 
  };

  s3.getObject(options, function (error, data) {
    console.log('s3.getObject');
    if (error != null) {
      console.log('Failed to retrieve an object: ' + error);
      res.status(500);
    } else {
      console.log('Loaded ' + data.ContentLength + ' bytes');
      // do something with data.body
      res.status(200);
      res.send(data.body);
    }
  });  
});

module.exports = router;

