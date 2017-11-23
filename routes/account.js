var express = require('express');
var router = express.Router();

var async = require('async');
var Web3 = require('web3');

const kStartBlock = 1000000;

router.get('/:account', function(req, res, next)
{  
  var config = req.app.get('config');  
  var web3 = new Web3();
  web3.setProvider(config.provider);
  
  var db = req.app.get('db');
  
  var data = {};
  
  async.waterfall([
    function(callback)
    {
      web3.eth.getBlock("latest", false, function(err, result) { callback(err, result); });
    },
    function(lastBlock, callback)
    {
      data.lastBlock = lastBlock.number;

      if(data.lastBlock > kStartBlock)
      {
        data.fromBlock = data.lastBlock - kStartBlock;
      }
      else
      {
        data.fromBlock = 0;
      }

      web3.eth.getBalance(req.params.account, function(err, balance) { callback(err, balance); });
    },
    function(balance, callback)
    {
      data.balance = balance;
      web3.eth.getCode(req.params.account, function(err, code) { callback(err, code); });
    },
    function(code, callback)
    {
      data.code = code;
      if (code !== "0x")
      {
        data.isContract = true;
      }
      
      db.get(req.params.account.toLowerCase(), function(err, value) { callback(null, value); });
    },
    function(source, callback)
    {      
      if (source)
      {
        data.source = JSON.parse(source);
        
        var abi = JSON.parse(data.source.abi);
        var contract = web3.eth.contract(abi).at(req.params.account);
        
        data.contractState = [];
        
        async.eachSeries(abi, function(item, eachCallback)
        {
          if (item.type === "function" && item.inputs.length === 0 && item.constant)
          {
            try
            {
              contract[item.name](function(err, result)
                                  {
                                    data.contractState.push({ name: item.name, result: result });
                                    eachCallback();
                                  });
            }
            catch(e)
            {
              console.log(e);
              eachCallback();
            }
          }
          else
          {
            eachCallback();
          }
        },
        function(err) { callback(err); });
      }
      else
      {
        callback();
      }
    },
    function(callback)
    {
      web3.trace.filter({ "fromBlock": "0x" + data.fromBlock.toString(16), "fromAddress": [ req.params.account ] },
                        function(err, traces) { callback(err, traces); });
    },
    function(tracesSent, callback)
    {
      data.tracesSent = tracesSent;
      web3.trace.filter({ "fromBlock": "0x" + data.fromBlock.toString(16), "toAddress": [ req.params.account ] },
                        function(err, traces) { callback(err, traces); });
    },
    function(tracesReceived, callback)
    {
      data.address = req.params.account;
      data.tracesReceived = tracesReceived;
      
      var numberOfBlocks = 0;
      var blocks = {};
      data.tracesSent.forEach(function(trace)
      {
        if (trace.action.from == req.params.account)
        {
          if (!blocks[trace.blockNumber])
          {
            blocks[trace.blockNumber] = [];
            numberOfBlocks++;
          }
          blocks[trace.blockNumber].push(trace);
        }
      });

      data.tracesReceived.forEach(function(trace)
      {
        if (trace.action.author == req.params.account ||
            trace.action.to == req.params.account)
        {
          if (!blocks[trace.blockNumber])
          {
            blocks[trace.blockNumber] = [];
            numberOfBlocks++;
          }
          blocks[trace.blockNumber].push(trace);
        }
      });

      var count = 0;
      for (var block in blocks)
      {
        web3.eth.getBlock(block, false,
                          function(err, result)
                          {
                            blocks[result.number].time = result.timestamp;
                            blocks[result.number].difficulty = result.difficulty;
                            count++;
                            if (count >= numberOfBlocks)
                            {
                              callback(err, blocks);
                            }
                          });
      }
    }
  ],

  function(err, blocks)
  {
    if (err)
    {
      return next(err);
    }
  
    data.tracesSent = null;
    data.tracesReceived = null;
    
    data.blocks = [];
    var txCounter = 0;
    for (var block in blocks)
    {
      //console.log(bb);
      data.blocks.push(blocks[block]);
      txCounter++;
    }
    
    if (data.source)
    {
      data.name = data.source.name;
    }
    else if (config.names[data.address])
    {
      data.name = config.names[data.address];
    }
    
    data.blocks = data.blocks.reverse().splice(0, 100000);
    res.render('account', { account: data });
  });
  
});

module.exports = router;
