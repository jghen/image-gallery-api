var express = require('express');
const {authorize} = require('./authMiddleware');
var router = express.Router();

/* GET home page. */
router.get('/', authorize, function(req, res, next) {
  const {userId} = req;
  if (userId!=null) {
    return res.json('Index: you are logged in');
  } else {
    return res.json('Index');
  }

  
  
  
});

module.exports = router;