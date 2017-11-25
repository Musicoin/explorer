var BigNumber = require('bignumber.js');

var Ether     = new BigNumber(10e+17);

function formatAmount(amount) {
  var ret = new BigNumber(amount.toString());
  
  return ret.dividedBy(Ether).toFixed(6) + " MUSIC";
}
module.exports = formatAmount;