let express = require('express');
let router = express.Router();

const bitcore = require("bitcore-lib");
const axios = require("axios");

const network = "BTCTEST";
const privateKey = "91qCQe7bkDj4jYiHgJUxhpye8ErNNnwK9vJEKiFGD6TBf1EGa4m";
const publicAddress = "mj4CNS8gScsNDhZDqFCGJfghEMHRpvfg9t";

router.get('/', function(req, res) {
    res.render('index', {
        balance: getBalance(publicAddress),
        error: req.flash('error'),
        success: req.flash('success'),
        address: publicAddress
    });
});

router.post('/', async function (req, res) {
    let btcAmount = req.body.amount;
    let address = req.body.address;

    if (btcAmount === undefined || btcAmount === "") {
        req.flash('error', "The amount to sent must be given.");
        res.redirect("/");
        return;
    }

    if (isNaN(btcAmount)) {
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

    sendBitcoin(address, btcAmount);
    req.flash('success', btcAmount + " BTC sent successfully to " + address
        + ". I may take up to few minutes before the transaction is completed.");
    res.redirect("/");
});

async function getBalance(address) {
    const url = `https://chain.so/api/v2/get_address_balance/${network}/${address}`;
    const result = await axios.get(url);
    const data = result.data.data;
    const confirmedBalance = parseFloat(data.confirmed_balance);
    const unconfirmedBalance = parseFloat(data.unconfirmed_balance);
    return (confirmedBalance + unconfirmedBalance).toFixed(8);
}

function sendBitcoin(toAddress, btcAmount) {
    // TODO: Proceed to do the real transfer ...
}

module.exports = router;
