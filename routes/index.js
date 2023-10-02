let express = require('express');
let router = express.Router();

const mnemonic = require("bitcore-mnemonic");
const bitcore = require("bitcore-lib");
const axios = require("axios");

const apiNetwork = "https://api.blockcypher.com/v1/btc/test3";
const privateKey = "91qCQe7bkDj4jYiHgJUxhpye8ErNNnwK9vJEKiFGD6TBf1EGa4m";
const publicAddress = "mj4CNS8gScsNDhZDqFCGJfghEMHRpvfg9t";
const blockCypherToken = "59b884b56bd04fb798b7b3fff8cce4e6";

router.get('/wallet', function(req, res) {

    // Génération d'une phrase mnémonique
    const seedPhrase = new mnemonic();
    console.log(`SEED PHRASE: ${seedPhrase}`);

    // Obtenir la clé privée depuis le hash de la phrase mnémonique
    const seedHash = bitcore.crypto.Hash.sha256(new Buffer(seedPhrase.toString()));
    const bn = bitcore.crypto.BN.fromBuffer(seedHash);
    const pk = new bitcore.PrivateKey(bn, bitcore.Networks.testnet); // Attention de spécifier le réseau TESTNET
    console.log(`CLÉ PRIVÉE 🔒: ${pk}`);

    // Obtenir l'adresse publique depuis la clé privée
    const walletAddress = pk.toAddress();
    console.log(`ADRESSE PUBLIQUE 🔗: ${walletAddress}`);

    // Optionnel, permet d'avoir un Wallet Import Format (voir https://en.bitcoin.it/wiki/Wallet_import_format)
    // const wif = pk.toWIF();

    res.send("SUCCESS! Check the node console.")
});

router.get('/', async function(req, res) {
    res.render('index', {
        balance: await getBalance(publicAddress),
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

    if (!bitcore.Address.isValid(address, bitcore.Networks.testnet)) {
        req.flash('error', "Invalid recipient address given. Be sure to use a valid BTC address on the test network.");
        res.redirect("/");
        return;
    }
    try {
        const result = await sendBitcoin(address, btcAmount);
        console.log(result);
        req.flash('success', btcAmount + " BTC sent successfully to " + address
            + ". I may take up to few minutes before the transaction is completed.");
        res.redirect("/");
    } catch (e) {
        let errorMessage = e.message;
        if (e.response && e.response.data && e.response.data.error) {
            errorMessage = errorMessage + " (" + e.response.data.error + ")";
        }
        req.flash('error', errorMessage);
        res.redirect("/");
    }
});

async function getBalance(address) {
    const url = `${apiNetwork}/addrs/${address}/balance`
    const result = await axios.get(url);
    const data = result.data;
    const confirmedBalance = parseFloat(data.final_balance / 100000000); // Values are in Sats (100,000,000 = 1 BTC)
    return confirmedBalance.toFixed(8);
}

async function sendBitcoin(toAddress, btcAmount) {
    const satoshiToSend = Math.ceil(btcAmount * 100000000);
    const txUrl = `${apiNetwork}/addrs/${publicAddress}?includeScript=true&unspentOnly=true`;
    const txResult = await axios.get(txUrl);

    let inputs = [];
    let totalAmountAvailable = 0;
    let inputCount = 0;

    let outputs = txResult.data.txrefs || [];
    outputs.concat(txResult.data.unconfirmed_txrefs || []);

    for (const element of outputs) {
        let utx = {};
        utx.satoshis = Number(element.value);
        utx.script = element.script;
        utx.address = txResult.data.address;
        utx.txId = element.tx_hash;
        utx.outputIndex = element.tx_output_n;
        totalAmountAvailable += utx.satoshis;
        console.log(totalAmountAvailable)
        inputCount += 1;
        inputs.push(utx);
    }

    const transaction = new bitcore.Transaction();
    transaction.from(inputs);

    let outputCount = 2;
    let transactionSize = inputCount * 148 + outputCount * 34 + 10;
    let fee = transactionSize * 20;

    if (totalAmountAvailable - satoshiToSend - fee < 0) {
        throw new Error("Not enough BTC to cover for the transaction.");
    }

    transaction.to(toAddress, satoshiToSend);
    transaction.fee(fee);
    transaction.change(publicAddress);
    transaction.sign(privateKey);

    const serializedTransaction = transaction.serialize();

    const result = await axios({
        method: "POST",
        url: `${apiNetwork}/txs/push?token=${blockCypherToken}`,
        data: {
            tx: serializedTransaction,
        },
    });
    return result.data;
}

module.exports = router;
