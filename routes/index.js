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

router.post('/', async function (req, res) {
    let amount = req.body.amount;
    let address = req.body.address;

    if (amount === undefined || amount === "") {
        res.redirect("/?error_msg=The amount to sent must be given.");
        return;
    }

    if (isNaN(amount)) {
        res.redirect("/?error_msg=The amount must be numeric.");
        return;
    }

    if (address === undefined || address === "") {
        res.redirect("/?error_msg=The recipient address must be given.");
        return;
    }

    // TODO: Test if the given BTC address is valid for the given network ...

    res.redirect("/?success_msg=" + amount + " BTC sent successfully to " + address + ". I may take up to few minutes before the transaction is completed.");
});

module.exports = router;
