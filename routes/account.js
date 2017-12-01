var express = require('express');
var router = express.Router();

var async = require('async');
var Web3 = require('web3');

var BigNumber = require('bignumber.js');

const kInitialMaxBlocks = 5000;
const kTargetNumberOfTransactions = 10000;

router.get('/:account', function(req, res, next)
{
  var T0 = Date.now();
  console.log("T0: %d", T0)

  var T1 = T0;
  var T2 = T0;
  var T3 = T0;
  var T4 = T0;
  var T5 = T0;
  var T6 = T0;
  var T7 = T0;

  var config = req.app.get('config');  
  var web3 = new Web3();
  web3.setProvider(config.provider);
  
  var db = req.app.get('db');
  
  var data = {};
  var blockList = [];
  var blockOffsets = [];
  
  async.waterfall([
    function(callback)
    {
      web3.eth.getBlock("latest", false, function(err, result) { callback(err, result); });
    },
    function(lastBlock, callback)
    {
      data.lastBlock = lastBlock.number;

      if(data.lastBlock > kInitialMaxBlocks)
      {
        data.fromBlock = data.lastBlock - kInitialMaxBlocks;
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
      // Disable this for now.
      if (false)//(source)
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
      T1 = Date.now();
      console.log("T1: %d, %f secs.", T1, (T1-T0) * 1e-3);

      console.log("From: 0x" + data.fromBlock.toString(16) + " (" + data.fromBlock + ")");
      console.log("To:   0x" + data.lastBlock.toString(16) + " (" + data.lastBlock + ")");

      data.tracesSent = [];

      web3.trace.filter({ "fromBlock": "0x" + data.fromBlock.toString(16),
                          "toBlock": "0x" + data.lastBlock.toString(16),
                          "fromAddress": [ req.params.account ] },
                        function(err, traces)
                        {
                          traces.forEach(function(trace)
                          {
                            if (trace.action.from == req.params.account)
                              data.tracesSent.push(trace);
                          });

                          callback(err);
                        });
    },
    function(callback)
    {
      data.tracesReceived = [];

      web3.trace.filter({ "fromBlock": "0x" + data.fromBlock.toString(16),
                          "toBlock": "0x" + data.lastBlock.toString(16),
                          "toAddress": [ req.params.account ] },
                        function(err, traces)
                        {
                          traces.forEach(function(trace)
                          {
                            if (trace.action.author == req.params.account ||
                                trace.action.to == req.params.account)
                              data.tracesReceived.push(trace);
                          });

                          callback(err);
                        });
    },
    function(callback)
    {
      T2 = Date.now();
      console.log("T2: %d, %f secs.", T2, (T2-T1) * 1e-3);

      data.numberOfTransactions = data.tracesSent.length + data.tracesReceived.length;
      var toBlock = data.fromBlock - 1;
      
      if (data.numberOfTransactions < kTargetNumberOfTransactions)
      {
        var numberToProcess = 0;
        if (data.numberOfTransactions > 0)
        {
          var processedBlocks = data.lastBlock - data.fromBlock + 1;
          var numberOfTransactionsLeft = kTargetNumberOfTransactions - data.numberOfTransactions;
          numberOfTransactionsLeft /= 5;  // Start with approximating for 20% more transactions to target.
          numberToProcess = Math.floor(processedBlocks * numberOfTransactionsLeft / data.numberOfTransactions);
          if (numberToProcess < kInitialMaxBlocks)
            numberToProcess = kInitialMaxBlocks;
        }
        else
        {
          numberToProcess = kInitialMaxBlocks;
        }
        console.log("numberToProcess: " + numberToProcess);
        
        var fromBlock = data.fromBlock - numberToProcess;
        if (fromBlock < 0)
          fromBlock = Math.floor(data.fromBlock / 2);

        data.fromBlock = fromBlock;

        console.log("From: 0x" + data.fromBlock.toString(16) + " (" + data.fromBlock + ")");
        console.log("To:   0x" + toBlock.toString(16) + " (" + toBlock + ")");

        web3.trace.filter({ "fromBlock": "0x" + data.fromBlock.toString(16),
                            "toBlock": "0x" + toBlock.toString(16),
                            "fromAddress": [ req.params.account ] },
                          function(err, traces)
                          {
                            traces.forEach(function(trace)
                            {
                              if (trace.action.from == req.params.account)
                                data.tracesSent.push(trace);
                            });

                            callback(err, toBlock);
                          });
      }
      else
      {
        callback(null, toBlock);
      }
    },
    function(toBlock, callback)
    {
      if (data.numberOfTransactions < kTargetNumberOfTransactions)
      {
        web3.trace.filter({ "fromBlock": "0x" + data.fromBlock.toString(16),
                            "toBlock": "0x" + toBlock.toString(16),
                            "toAddress": [ req.params.account ] },
                          function(err, traces)
                          {
                            traces.forEach(function(trace)
                            {
                              if (trace.action.author == req.params.account ||
                                  trace.action.to == req.params.account)
                                data.tracesReceived.push(trace);
                            });

                            callback(err);
                          });
      }
      else
      {
        callback();
      }
    },      
    function(callback)
    {
      T3 = Date.now();
      console.log("T3: %d, %f secs.", T3, (T3-T2) * 1e-3);

      data.address = req.params.account;
      data.numberOfTransactions = data.tracesSent.length + data.tracesReceived.length;
      console.log("Number of transactions = %d, from block %d",
                  data.numberOfTransactions, data.fromBlock);
      
      var numberOfBlocks = 0;
      var blocks = {};
      data.tracesSent.forEach(function(trace)
      {
        //if (trace.action.from == req.params.account)
        {
          if (!blocks[trace.blockNumber])
          {
            blocks[trace.blockNumber] = [];
            numberOfBlocks++;
          }
          blocks[trace.blockNumber].push(trace);
        }
      });
  
      console.log("data.tracesReceived.length = %d", data.tracesReceived.length);

      data.tracesReceived.forEach(function(trace)
      {
        //if (trace.action.author == req.params.account ||
        //    trace.action.to == req.params.account)
        {
          if (!blocks[trace.blockNumber])
          {
            blocks[trace.blockNumber] = [];
            numberOfBlocks++;
          }
          blocks[trace.blockNumber].push(trace);
        }
      });
      
      data.blockCount = numberOfBlocks;
      console.log("data.blockCount = %d", data.blockCount);

      for (var block in blocks)
      {
        blockList.push(block);
      }

      var count = 0;

      async.eachOfSeries
      (blockList,
       async function(block)
       {
         web3.eth.getBlock(block, false,
                           function(err, result)
                           {
                             blocks[result.number].time = result.timestamp;
                             blocks[result.number].difficulty = result.difficulty;
                             //blocks[result.number].gasUsed = result.gasUsed;
                             count++;
                             if (count >= data.blockCount)
                             {
                               callback(err, blocks);
                             }
                           });
       });
    },
    function(blocks, callback)
    {
      T4 = Date.now();
      console.log("T4: %d, %f secs.", T4, (T4-T3) * 1e-3);

      var count = 0;

      async.eachOfSeries
      (blockList,
       async function(block)
       {
         web3.eth.getBalance(data.address, block, 
                             function(err, result)
                             {
                               blocks[block].balance = result;
                               count++;
                               if (count >= data.blockCount)
                               {
                                 callback(err, blocks);
                               }
                             });
       });
    }
  ],

  function(err, blocks)
  {
    T5 = Date.now();
    console.log("T5: %d, %f secs.", T5, (T5-T4) * 1e-3);

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

    data.blocks = data.blocks.reverse().splice(0, 5*kTargetNumberOfTransactions);

    T6 = Date.now();
    console.log("T6: %d, %f secs.", T6, (T6-T5) * 1e-3);

    res.render('account', { account: data });

    T7 = Date.now();
    console.log("T7: %d, %f secs.", T7, (T7-T6) * 1e-3);

    var TE = Date.now();
    console.log("TE: %d, %f secs.", TE, (TE-T0) * 1e-3);
  });
  
});

module.exports = router;
