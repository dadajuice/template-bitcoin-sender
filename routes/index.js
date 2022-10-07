let express = require('express');
let router = express.Router();

router.get('/', function(req, res) {
  let publicAddress = "mj4CNS8gScsNDhZDqFCGJfghEMHRpvfg9t";
  res.render('index', {
    balance: "0.00000",
    error: req.query.error_msg,
    success: req.query.success_msg,
    address: publicAddress
  });
});

module.exports = router;
