var web3 = require('web3');
var net = require('net');

var config = function ()
{  
  this.logFormat = "combined";
  this.ipcPath = "\\\\.\\pipe\\musicoin.ipc";
  this.provider = new web3.providers.IpcProvider(this.ipcPath, net);
  
  this.bootstrapUrl = "https://maxcdn.bootstrapcdn.com/bootswatch/3.3.7/yeti/bootstrap.min.css";
  
  this.names =
  {
    "0x00297dbed0856c7915b91cb88a61e1930156a330": "Developer SJL",
    "0x89dbd56e0ac511518416fdcf5ccb452c2e89e0d4": "musicoin.miningpoolhub.com",
    "0x6c2da62088e88059c5eb008e161bcef038839516": "musicoin.miningclub.info",
    "0x7be6f70c1a9903146c49685fb4811b18348bb91c": "mc.minecrypto.pro",
    "0xb5e08179a97359f189a07b51478c2ba2fc779cf0": "mc.minecrypto.pro",
    "0x3a0b46a62ed6d65d98a6129d6e50dc714c1cfe23": "gmc.epool.io",
    "0x1cc2f94b2cd644aa3d262f7b144088b810375f80": "music.mypool.online",
    "0xa11d858c900487ad62dcc1cecdd87d4514fb70fa": "music.reidocoin.com.br"
  }
  
  this.sslKey = "C:/ProgramData/letsencrypt-win-simple/httpsacme-v01.api.letsencrypt.org/explorer.musicoin.org-key.pem";
  this.sslCertificate = "C:/ProgramData/letsencrypt-win-simple/httpsacme-v01.api.letsencrypt.org/explorer.musicoin.org-crt.pem";
  this.port = 443;
}

module.exports = config;
