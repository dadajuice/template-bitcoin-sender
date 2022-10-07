let express = require('express');
let router = express.Router();

router.get('/', function(req, res) {
    let publicAddress = "mj4CNS8gScsNDhZDqFCGJfghEMHRpvfg9t";
    res.render('index', {
        balance: "0.00000",
        error: req.flash('error'),
        success: req.flash('success'),
        address: publicAddress
    });
});

router.post('/', async function (req, res) {
    let amount = req.body.amount;
    let address = req.body.address;

    if (amount === undefined || amount === "") {
        req.flash('error', "The amount to sent must be given.");
        res.redirect("/");
        return;
    }

    if (isNaN(amount)) {
        req.flash('error', "The amount must be numeric.");
        res.redirect("/");
        return;
    }

    if (address === undefined || address === "") {
        req.flash('error', "The recipient address must be given.");
        res.redirect("/");
        return;
    }

    // TODO: Test if the given BTC address is valid for the given network ...

    req.flash('success', amount + " BTC sent successfully to " + address
        + ". I may take up to few minutes before the transaction is completed.");
    res.redirect("/");
});

module.exports = router;
