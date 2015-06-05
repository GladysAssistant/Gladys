/**
 * Filename: commands.js
 * AppLamp.nl led light API: wifi box byte commands
 * © AppLamp.nl: you can share,modify and use this code (commercially) as long as you
 * keep the referer "AppLamp.nl led light API" in the file header.
 * RESPECT AT LEAST 50 MS BETWEEN EACH SEND COMMAND TO PREVENT PACKAGE LOSS
 * The functions in this file will return the appropriate hex commands as 3 byte array
 * to send to an UDP-socket towards WIFI BOX-IP:8899 (see wifibox.js)
 * Example Usage in Node JS:
 * var cmd = require('commands.js');
 * example turn on all white bulbs on:
 * cmd.white.allOn();
 * set the hue of a color bulb to yellow
 * cmd.rgbw.hue(128);
 * @method ColorRgbwCmd
 * @return 
 */
var ColorRgbwCmd = function(){};
/**
 * Description
 * @method WhiteCmd
 * @return 
 */
var WhiteCmd     = function(){};
/**
 * Description
 * @method ColorRgbCmd
 * @return 
 */
var ColorRgbCmd  = function(){};
//makes the rgb/rgbw/white variables globally available in NodeJS
// for ex. use: commands.rgbw.hue(64);
 
module.exports = { rgb: new ColorRgbCmd()
		  ,rgbw: new ColorRgbwCmd()
		  ,white: new WhiteCmd() };
				   
				   
 
/*RGBW BULBS AND CONTROLLERS, 4-CHANNEL/ZONE MODELS */
 
 
/**
 * Switch ON() your light or make it ACTIVE 
 * use function parameter `zone` with value '0' to target ALL zones, 
 * value '1' for zone 1, value '2' for zone 2,... to 4 
 * You can also use this command to link your bulbs 
 * Prepend this command once for the appropriate zone to activate the zone 
 * before using hue() / brightness() / whiteMode() / effectModeNext()
 * @method on
 * @param {} zone
 * @return ArrayExpression
 */
ColorRgbwCmd.prototype.on = function(zone)
{  return [[0x42,0x45,0x47,0x49,0x4B][zone],0x00,0x55] }; 
 
/**
 * use function parameter `zone` with value '0' to target ALL zones, 
 * value '1' for zone 1, value '2' for zone 2,... to 4 
 * @method off
 * @param {} zone
 * @return ArrayExpression
 */
ColorRgbwCmd.prototype.off = function(zone)
{  return [[0x41,0x46,0x48,0x4A,0x4C][zone],0x00,0x55] };
 
/**
 * Shortcut to ON(0) 
 * @method allOn
 * @return 
 */
ColorRgbwCmd.prototype.allOn  = function(){  this.on(0) };
/**
 * Description
 * @method allOff
 * @return 
 */
ColorRgbwCmd.prototype.allOff = function(){  this.off(0) };
 
/**
 * Hue range 0-255 [targets last ON() activated bulb(s)] 
 * @method hue
 * @param {} decimal
 * @return ArrayExpression
 */
ColorRgbwCmd.prototype.hue =  function(decimal)
{  
	var hex = decimal.toString(16);
	hex = (hex.length < 2) ? '0x0'+hex : '0x'+hex;	
	return [0x40,hex,0x55];
}
/**
 * Switch to white mode [targets last ON() activated bulb(s)] 
 * @method whiteMode
 * @return ArrayExpression
 */
ColorRgbwCmd.prototype.whiteMode = 	function(){  	return [0xC2,00,0x55] };
/**
 * Brightness range 1-100 [targets last ON() activated bulb(s)]
 * @method brightness
 * @param {} percent
 * @return ArrayExpression
 */
ColorRgbwCmd.prototype.brightness = 	function(percent)
{ 	brightnessIndex = Math.max( 0,(Math.ceil(percent/100*19))-1 ); //19 steps
	return [ 0x4E 
		 ,[ 0x02,0x03,0x04,0x05,0x08,0x09
		   ,0x0A,0x0B,0x0D,0x0E,0x0F,0x10,0x11
		   ,0x12,0x13,0x14,0x15,0x17,0x18,0x19][brightnessIndex] 
		 , 0x55
	       ]; 	
};
 
/**
 * Effect mode next [targets last ON() activated bulb(s)] 
 * @method effectModeNext
 * @return ArrayExpression
 */
ColorRgbwCmd.prototype.effectModeNext =	function(){  return [0x4D,0x00,0x55] };
/**
 * Description
 * @method effectSpeedUp
 * @return ArrayExpression
 */
ColorRgbwCmd.prototype.effectSpeedUp = 	function(){  return [0x44,0x00,0x55] };
/**
 * Description
 * @method effectSpeedDown
 * @return ArrayExpression
 */
ColorRgbwCmd.prototype.effectSpeedDown= function(){  return [0x44,0x00,0x55] };
 
 
 
/* DUAL WHITE BULBS & CONTROLLERS */
 
 
/**
 * Switch ON() your light or make it ACTIVE 
 * use function parameter `zone` with value '0' to target ALL zones, 
 * value '1' for zone 1, value '2' for zone 2,... to 4 
 * You can also use this command to link your bulbs 
 * Prepend this command once for the appropriate zone to activate the zone 
 * before using brightUp() / brightDown() / warmer() / cooler() 
 * @method on
 * @param {} zone
 * @return ArrayExpression
 */
WhiteCmd.prototype.on = function(zone){  return [[0x45, 0x38,0x3D,0x37,0x32][zone],0x00,0x55]; };
 
/**
 * Switch OFF zone with value '0' to target ALL zones, 
 * , value '1' for zone 1, value '2' for zone 2,... to 4 
 * @method off
 * @param {} zone
 * @return ArrayExpression
 */
WhiteCmd.prototype.off = function(zone)
{ return [[0x39, 0x3B,0x33,0x3A,0x36][zone],0x00,0x55]; };
 
/**
 * Switch zone to Night Light Mode with value '0' to target ALL zones, 
 * , value '1' for zone 1, value '2' for zone 2,... to 4 
 * @method nightMode
 * @param {} zone
 * @return ArrayExpression
 */
WhiteCmd.prototype.nightMode = function(zone)
{ return [[0xB9, 0x3B,0x33,0x3A,0x36][index],0x00,0x55]; };
/**
 * Description
 * @method allOn
 * @return ArrayExpression
 */
WhiteCmd.prototype.allOn = 		function(){ return [0x45,0x00,0x55] };
/**
 * Description
 * @method allOff
 * @return ArrayExpression
 */
WhiteCmd.prototype.allOff = 	function(){ return [0x39,0x00,0x55] };
/**
 * Description
 * @method brightUp
 * @return ArrayExpression
 */
WhiteCmd.prototype.brightUp = 	function(){ return [0x3c,0x00,0x55] };
/**
 * Description
 * @method brightDown
 * @return ArrayExpression
 */
WhiteCmd.prototype.brightDown = function(){ return [0x34,0x00,0x55] };
/**
 * Description
 * @method warmer
 * @return ArrayExpression
 */
WhiteCmd.prototype.warmer = 	function(){ return [0x3E,0x00,0x55] };
/**
 * Description
 * @method cooler
 * @return ArrayExpression
 */
WhiteCmd.prototype.cooler = 	function(){ return [0x3F,0x00,0x55] };
 
 
 
/**
 * RGB BULBS & CONTROLLERS, PREVIOUS GNERATION SINGLE CHANNEL/ZONE
 * @method off
 * @return ArrayExpression
 */
ColorRgbCmd.prototype.off = function(){ return [0x21,0x00,0x55] };
/**
 * Description
 * @method on
 * @return ArrayExpression
 */
ColorRgbCmd.prototype.on = function(){ return [0x22,0x00,0x55] };
/**
 * Description
 * @method hue
 * @param {} decimal
 * @return ArrayExpression
 */
ColorRgbCmd.prototype.hue = function(decimal)
{  
	var hex = decimal.toString(16);
	hex = (hex.length < 2) ? '0x0'+hex : '0x'+hex;	
	return [0x20,hex,0x55]; 	
};
/**
 * Description
 * @method brightUp
 * @return ArrayExpression
 */
ColorRgbCmd.prototype.brightUp = 	function(){ return [0x23,0x00,0x55] };
/**
 * Description
 * @method brightDown
 * @return ArrayExpression
 */
ColorRgbCmd.prototype.brightDown = 	function(){ return [0x24,0x00,0x55] };
/**
 * Description
 * @method speedUp
 * @return ArrayExpression
 */
ColorRgbCmd.prototype.speedUp = 	function(){ return [0x25,0x00,0x55] };
/**
 * Description
 * @method speedDown
 * @return ArrayExpression
 */
ColorRgbCmd.prototype.speedDown = 	function(){ return [0x26,0x00,0x55] };
/**
 * Description
 * @method effectSpeedUp
 * @return ArrayExpression
 */
ColorRgbCmd.prototype.effectSpeedUp = 	function(){ return [0x27,0x00,0x55] };
/**
 * Description
 * @method effectSpeedDown
 * @return ArrayExpression
 */
ColorRgbCmd.prototype.effectSpeedDown = function(){ return [0x28,0x00,0x55] };