var express = require('express');
var router = express.Router();
var BigNumber = require('bignumber.js');

var Web3 = require('web3');

router.get('/currentBlock', function(req, res, next)
{
  var config = req.app.get('config');  
  var web3 = new Web3();
  web3.setProvider(config.provider);

  web3.eth.getBlock("latest", false, function(err, result)
  {
    if (err)
      return next(err);

    res.status(200).send(result.number.toString());
  });
});

router.get('/block/:block', function(req, res, next)
{
  var config = req.app.get('config');  
  var web3 = new Web3();
  web3.setProvider(config.provider);

  web3.eth.getBlock(req.params.block, false, function(err, result)
  {
    if (err)
      return next(err);

    res.status(200).send(result);
  });
});

router.get('/accountBalance/:address', function(req, res, next)
{
  var config = req.app.get('config');  
  var web3 = new Web3();
  web3.setProvider(config.provider);

  var Factor = new BigNumber(10e+17);

  web3.eth.getBalance(req.params.address, function(err, balance)
  {
    if (err)
      return next(err);

    var balanceMUSIC = new BigNumber(balance.toString());
    res.status(200).send(balanceMUSIC.dividedBy(Factor).toFixed(9));
  });
});

router.get('/transaction/:transactionHash', function(req, res, next)
{
  var config = req.app.get('config');  
  var web3 = new Web3();
  web3.setProvider(config.provider);

  web3.trace.transaction(req.params.transactionHash, function(err, traces)
  {
    if (err)
      return next(err);

    res.status(200).send(traces);
  });
});

router.get('/totalCoins', function(req, res, next)
{
  var config = req.app.get('config');  
  var web3 = new Web3();
  web3.setProvider(config.provider);

  web3.eth.getBlock("latest", false, function(err, result)
  {
    if (err)
      return next(err);

    var totalCoins = 314 * result.number;
    res.status(200).send(totalCoins.toString());
  });
});

module.exports = router;
