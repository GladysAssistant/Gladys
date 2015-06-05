/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
  
//   SunriseSunset Class (2013-04-21)
//
// OVERVIEW
//
//   Implementation of http://williams.best.vwh.net/sunrise_sunset_algorithm.htm
//
// LICENSE
//
//   Copyright 2011-2013 Preston Hunt <me@prestonhunt.com>
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//       http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.
//
// DESCRIPTION
//
//   Provides sunrise and sunset times for specified date and position.
//   All dates are UTC.  Year is 4-digit.  Month is 1-12.  Day is 1-31.
//   Longitude is positive for east, negative for west. Latitude is
//   positive for north, negative for south.
//
// SAMPLE USAGE
//
//   var tokyo = new SunriseSunset( 2011, 1, 19, 35+40/60, 139+45/60); 
//   tokyo.sunriseUtcHours()      --> 21.8199 = 21:49 GMT
//   tokyo.sunsetUtcHours()       --> 7.9070  = 07:54 GMT
//   tokyo.sunriseLocalHours(9)   --> 6.8199  = 06:49 at GMT+9
//   tokyo.sunsetLocalHours(9)    --> 16.9070 = 16:54 at GMT+9
//   tokyo.isDaylight(1.5)        --> true
//
//   var losangeles = new SunriseSunset( 2011, 1, 19, 34.05, -118.233333333 );
//   etc.



module.exports = {

    /**
     * Description
     * @method isDaylight
     * @param {} latitude
     * @param {} longitude
     * @return CallExpression
     */
    isDaylight: function(latitude, longitude){
        var date = new Date();
        var here = new SunriseSunset( date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() , latitude, longitude); 
        var hour = date.getUTCHours() + ((date.getUTCMinutes()*100)/60)/100;
        return here.isDaylight(hour);
    },

    /**
     * Description
     * @method sunriseUtcHours
     * @param {} latitude
     * @param {} longitude
     * @return CallExpression
     */
    sunriseUtcHours: function(latitude,longitude){
        var date = new Date();
        var here = new SunriseSunset( date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() , latitude, longitude);
        return here.sunriseUtcHours();
    },

    /**
     * Description
     * @method sunsetUtcHours
     * @param {} latitude
     * @param {} longitude
     * @return CallExpression
     */
    sunsetUtcHours: function(latitude,longitude){
        var date = new Date();
        var here = new SunriseSunset( date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() , latitude, longitude);
        return here.sunsetUtcHours();
    }

};


/**
 * Description
 * @method SunriseSunset
 * @param {} utcFullYear
 * @param {} utcMonth
 * @param {} utcDay
 * @param {} latitude
 * @param {} longitude
 * @return 
 */
var SunriseSunset = function( utcFullYear, utcMonth, utcDay, latitude, longitude ) {
    this.zenith = 90 + 50/60; //   offical      = 90 degrees 50'
                              //   civil        = 96 degrees
                              //   nautical     = 102 degrees
                              //   astronomical = 108 degrees

    this.utcFullYear = utcFullYear;
    this.utcMonth = utcMonth;
    this.utcDay = utcDay;
    this.latitude = latitude;
    this.longitude = longitude;

    this.rising = true; // set to true for sunrise, false for sunset
    this.lngHour = this.longitude / 15;
};

SunriseSunset.prototype = {
    /**
     * Description
     * @method sin
     * @param {} deg
     * @return CallExpression
     */
    sin: function( deg ) { return Math.sin( deg * Math.PI / 180 ); },
    /**
     * Description
     * @method cos
     * @param {} deg
     * @return CallExpression
     */
    cos: function( deg ) { return Math.cos( deg * Math.PI / 180 ); },
    /**
     * Description
     * @method tan
     * @param {} deg
     * @return CallExpression
     */
    tan: function( deg ) { return Math.tan( deg * Math.PI / 180 ); },
    /**
     * Description
     * @method asin
     * @param {} x
     * @return BinaryExpression
     */
    asin: function( x ) { return (180/Math.PI) * Math.asin(x); },
    /**
     * Description
     * @method acos
     * @param {} x
     * @return BinaryExpression
     */
    acos: function( x ) { return (180/Math.PI) * Math.acos(x); },
    /**
     * Description
     * @method atan
     * @param {} x
     * @return BinaryExpression
     */
    atan: function( x ) { return (180/Math.PI) * Math.atan(x); },

    /**
     * Description
     * @method getDOY
     * @return N
     */
    getDOY: function() {
        var month = this.utcMonth,
            year = this.utcFullYear,
            day = this.utcDay;

        var N1 = Math.floor( 275 * month / 9 );
        var N2 = Math.floor( (month + 9) / 12 );
        var N3 = (1 + Math.floor((year - 4 * Math.floor(year / 4 ) + 2) / 3));
        var N = N1 - (N2 * N3) + day - 30;
        return N;
    },

    /**
     * Description
     * @method approximateTime
     * @return 
     */
    approximateTime: function() {
        var doy = this.getDOY();
        if ( this.rising ) {
            return doy + ((6 - this.lngHour) / 24);
        } else {
            return doy + ((18 - this.lngHour) / 24);
        }
    },

    /**
     * Description
     * @method meanAnomaly
     * @return BinaryExpression
     */
    meanAnomaly: function() {
        var t = this.approximateTime();
        return (0.9856 * t) - 3.289;
    },

    /**
     * Description
     * @method trueLongitude
     * @return BinaryExpression
     */
    trueLongitude: function() {
        var M = this.meanAnomaly();
        var L = M + (1.916 * this.sin(M)) + (0.020 * this.sin(2 * M)) + 282.634;
        return L % 360;
    },

    /**
     * Description
     * @method rightAscension
     * @return RA
     */
    rightAscension: function() {
        var L = this.trueLongitude();
        var RA = this.atan(0.91764 * this.tan(L));
        RA %= 360;

        var Lquadrant  = (Math.floor( L/90)) * 90;
        var RAquadrant = (Math.floor(RA/90)) * 90;
        RA = RA + (Lquadrant - RAquadrant);
        RA /= 15;

        return RA;
    },

    /**
     * Description
     * @method sinDec
     * @return sinDec
     */
    sinDec: function() {
        var L = this.trueLongitude(),
            sinDec = 0.39782 * this.sin(L);

        return sinDec;
    },

    /**
     * Description
     * @method cosDec
     * @return CallExpression
     */
    cosDec: function() {
        return this.cos(this.asin(this.sinDec()));
    },

    /**
     * Description
     * @method localMeanTime
     * @return 
     */
    localMeanTime: function() {
        var cosH = (this.cos(this.zenith) - (this.sinDec() * this.sin(this.latitude))) / (this.cosDec() * this.cos(this.latitude));

        if (cosH >  1) {
            return "the sun never rises on this location (on the specified date)";
        } else if (cosH < -1) {
            return "the sun never sets on this location (on the specified date)";
        } else {
            var H = this.rising ? 360 - this.acos(cosH) : this.acos(cosH);
            H /= 15;
            var RA = this.rightAscension();
            var t = this.approximateTime();
            var T = H + RA - (0.06571 * t) - 6.622;
            return T;
        }
    },

    /**
     * Description
     * @method hoursRange
     * @param {} h
     * @return BinaryExpression
     */
    hoursRange: function( h ) {
        return (h+24) % 24;
    },

    /**
     * Description
     * @method UTCTime
     * @return CallExpression
     */
    UTCTime: function() {
        var T = this.localMeanTime();
        var UT = T - this.lngHour;
        return this.hoursRange( UT );
        //if ( UT < 0 ) UT += 24;
        //return UT % 24;
    },

    /**
     * Description
     * @method sunriseUtcHours
     * @return CallExpression
     */
    sunriseUtcHours: function() {
        this.rising = true;
        return this.UTCTime();
    },

    /**
     * Description
     * @method sunsetUtcHours
     * @return CallExpression
     */
    sunsetUtcHours: function() {
        this.rising = false;
        return this.UTCTime();
    },

    /**
     * Description
     * @method sunriseLocalHours
     * @param {} gmt
     * @return CallExpression
     */
    sunriseLocalHours: function(gmt) {
        return this.hoursRange( gmt + this.sunriseUtcHours() );
    },

    /**
     * Description
     * @method sunsetLocalHours
     * @param {} gmt
     * @return CallExpression
     */
    sunsetLocalHours: function(gmt) {
        return this.hoursRange( gmt + this.sunsetUtcHours() );
    },

    // utcCurrentHours is the time that you would like to test for daylight, in hours, at UTC
    // For example, to test if it's daylight in Tokyo (GMT+9) at 10:30am, pass in
    // utcCurrentHours=1.5, which corresponds to 1:30am UTC.
    /**
     * Description
     * @method isDaylight
     * @param {} utcCurrentHours
     * @return Literal
     */
    isDaylight: function( utcCurrentHours ) {
        var sunriseHours = this.sunriseUtcHours(),
            sunsetHours = this.sunsetUtcHours();

        if ( sunsetHours < sunriseHours ) {
            // Either the sunrise or sunset time is for tomorrow
            if ( utcCurrentHours > sunriseHours ) {
                return true;
            } else if ( utcCurrentHours < sunsetHours ) {
                return true;
            } else {
                return false;
            }
        }

        if ( utcCurrentHours >= sunriseHours ) {
            return utcCurrentHours < sunsetHours;
        } 

        return false;
    }
};