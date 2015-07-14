/**
 Filename: wifibox.js
 //AppLamp.nl Wifi LED light API: wifi box UDP socket, command sender
 © AppLamp.nl: you can share,modify and use this code (commercially) as long as you
 keep the referer "AppLamp.nl led light API" in the file header.
 
 
 Usage in Node JS:
     //load this wifi box class
     var WifiBoxModule = require('wifibox.js');
     var cmd = require('commands.js');
     //create instance with wifi box ip and port
     var box = new WifiBoxModule("192.168.1.255", 8899);
     //send a command ( see commands.js )
     box.command(cmd.rgbw.hue(180));
     box.command(cmd.white.allOn());
     
     
     TIP: You don't need to know the exact IP of your Wifi Box. 
          If you know your DHCP IP range, just replace the last digit to .255 
          That way you wil perform a UDP multicast and the wifi box will receive it. 
          So for example your network range is 192.168.1.1  to 192.18.1.254,
          then use 192.18.1.255 to perform a multicast.
 **/
 
var http = require('http');
var dgram = require('dgram');
 
/**
 * Description
 * @method WifiBox
 * @param {} ip
 * @param {} port
 * @return 
 */
var WifiBox = function (ip, port) {
    this.client = dgram.createSocket('udp4');
    var default_ip = '192.168.1.255';
    var default_port = 8899;
    this.ip = (ip != undefined && ip.length > 6) ? ip : default_ip;
    this.port = (port != undefined && port > 0) ? port : default_port;
 
};
 
 
/**
 * Description
 * @method command
 * @param {} threeByteArray
 * @return 
 */
WifiBox.prototype.command = function (threeByteArray) {
    var buffer = new Buffer(threeByteArray);
    this.client.send(buffer
        , 0
        , buffer.length
        , this.port
        , this.ip
        , function (err, bytes) {
            if (err) {
                console.log("udp error:" + err);
                throw err;
            } else {
                console.log('bytes send: ' + [threeByteArray[0], threeByteArray[1], threeByteArray[2]]);
            }
        }
    );
};
 
/**
 * Description
 * @method toString
 * @return BinaryExpression
 */
WifiBox.prototype.toString = function () {
    return 'WifiBox: { ip:' + this.ip + ':' + this.port + '}';
};
 
 
module.exports = WifiBox;