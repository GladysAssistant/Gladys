const os = require('os');
const logger = require('../../../../utils/logger');
var net    = require('net'), Socket = net.Socket;

function getBroadcastAdresses() {
    const interfaces = os.networkInterfaces();
    logger.info("==============================================");
    logger.info(interfaces);
    logger.info("==============================================");

    var LAN = '192.168.1'; //Local area network to scan (this is rough)
    var port = 48899; //globally recognized LLRP port for RFID readers

    //scan over a range of IP addresses and execute a function each time the LLRP port is shown to be open.
    for(var i=1; i <=255; i++){
        checkPort(port, LAN+'.'+i, function(error, status, host, port){
            if(status == "open"){
                logger.info("Reader found: ", host, port, status);
            }
        });
    }

    logger.info("==============================================");
    return interfaces;
}

function checkPort(port, host, callback) {
    var socket = new Socket(), status = null;

    // Socket connection established, port is open
    socket.on('connect', function() {status = 'open';socket.end();});
    socket.setTimeout(1500);// If no response, assume port is not listening
    socket.on('timeout', function() {status = 'closed';socket.destroy();});
    socket.on('error', function(exception) {status = 'closed';});
    socket.on('close', function(exception) {callback(null, status,host,port);});

    socket.connect(port, host);
}

module.exports = {
    getBroadcastAdresses,
  };
  