/**
 * @fileoverview Server-side calibration component
 * @author Jean-Philippe.Lambert@ircam.fr
 * @copyright 2015 IRCAM, Paris, France
 * @license BSD-3-Clause
 */

'use strict';

var debug = require('debug')('soundworks:server:calibration');
var fs = require('fs');
var path = require('path');
var string = require('../common/string');

var CalibrationServer = (function(){var PRS$0 = (function(o,t){o["__proto__"]={"a":t};return o["a"]===t})({},{});var DP$0 = Object.defineProperty;var GOPD$0 = Object.getOwnPropertyDescriptor;var MIXIN$0 = function(t,s){for(var p in s){if(s.hasOwnProperty(p)){DP$0(t,p,GOPD$0(s,p));}}return t};var proto$0={};
  /**
   * @callback CalibrationServer~sendFunction
   * @see {@linkcode CalibrationClient~receiveFunction}
   * @param {String} messageType identification of pong message type
   * @param {...Any} arguments
   **/

  /**
   * @callback CalibrationServer~receiveFunction
   * @see {@linkcode CalibrationClient~sendFunction}
   * @param {String} messageType identification of ping message type
   * @param {CalibrationServer~receiveCallback} receiveCallback called on
   * each message matching messageType.
   **/

  /**
   * @callback CalibrationServer~receiveCallback
   * @param {...Any} arguments
   */

  /**
   * This is the constructor. See {@linkcode CalibrationServer~save}
   * and {@linkcode CalibrationServer~load}
   *
   * @constructs CalibrationServer
   * @param {Object} [params]
   * @param {Object} [params.persistent]
   * @param {String} [params.persistent.path='../../data']
   * @param {String} [params.persistent.file='calibration.json']
   * @param {String} [params.persistent.fileEncoding='utf8']
   */
  function CalibrationServer() {var params = arguments[0];if(params === void 0)params = { persistent: {} };
    this.persistent = {};
    if(typeof params.persistent === 'undefined') {
      params.persistent = {};
    }

    this.persistent.path = (typeof params.persistent.path !== 'undefined'
                            ? params.persistent.path
                            : path.join(__dirname, '../../data') );

    this.persistent.file
      = path.join(this.persistent.path,
                  (typeof params.persistent.file !== 'undefined'
                   ? params.persistent.file
                   : 'calibration.json') );

    this.persistent.fileEncoding
      = (typeof params.persistent.fileEncoding !== 'undefined'
         ? params.persistent.fileEncoding
         : 'utf8' );

    this.persistent.data = {};

    try {
      fs.mkdirSync(this.persistent.path);
      console.log('Creating data directory: ' + this.persistent.path);
    } catch (error) {
      if(error.code === 'EEXIST') {
        debug('Using existing data directory: ' + this.persistent.path);
      }
      else {
        console.log('Error creating data directory: ' + this.persistent.path);
      }
    }

    try {
      var data = fs.readFileSync(this.persistent.file,
                                   this.persistent.fileEncoding);
      this.persistent.data = JSON.parse(data);
    } catch (error) {
      if(error.code === 'ENOENT') {
        debug('Creating new persistent file: ' + this.persistent.file);
        // ensure that there is at least the default value
        this.persistent.data = {
          default: {
            audio: [
              [
                'default',
                {
                  delay: 0,
                  gain: 0
                }
              ]
            ]
          }
        };
      } else {
        console.log('Error while reading persistent file: ' + error);
      }
    }
    this.levenshtein = new string.Levenshtein();
  }DP$0(CalibrationServer,"prototype",{"configurable":false,"enumerable":false,"writable":false});

  /**
   * Start a calibration process by registering the send and receive
   * functions.
   *
   * @function CalibrationServer~start
   * @param {CalibrationServer~sendFunction} sendFunction
   * @param {CalibrationServer~receiveFunction} receiveFunction
   */
  proto$0.start = function(sendFunction, receiveFunction) {var this$0 = this;
    // register receive functions
    receiveFunction('calibration:load', function(params)  {
      var calibration = (distance = this$0.load(params)).calibration, distance = distance.distance;
      if(distance < Infinity) {
        sendFunction('calibration:set', calibration);
      }
    });

    receiveFunction('calibration:save', function(params)  {
      this$0.save(params);
    });
  };

  /**
   * Store the given calibration.
   *
   * @function CalibrationServer~save
   * @param {Object} params
   * @param {String} params.id key used to store and retrieve the
   * associated calibration. See {@linkcode CalibrationClient~getId}.
   * @param {calibration} params.calibration to store
   * @returns {Boolean} true if file is actually written. Please note
   * that the write operation is asynchronous.
   */
  proto$0.save = function(params) {
    var writeFile = false;
    if(typeof params !== 'undefined'
       && typeof params.id !== 'undefined'
       && typeof params.calibration !== 'undefined') {
      var date = new Date();

      for(var c in params.calibration) {
        if(params.calibration.hasOwnProperty(c) ) {
          writeFile = true;
          if(typeof this.persistent.data[params.id] === 'undefined') {
            this.persistent.data[params.id] = {};
          }

          if(typeof this.persistent.data[params.id][c] === 'undefined') {
            this.persistent.data[params.id][c] = [];
          }
          this.persistent.data[params.id][c]
            .push([date.toISOString(), params.calibration[c]]);

          debug('%s: %s -> %s', date.toISOString(), params.id,
                params.calibration[c]);
        }
      }

      if(writeFile) {
        fs.writeFile(this.persistent.file, JSON.stringify(this.persistent.data) );
      }
    }
    return writeFile;
  };

  /**
   * @typedef CalibrationServer~loadReturn
   * @type Object
   * @property {calibration} calibration or empty object {} if nothing
   * found.
   * @property {Number} distance Infinity if nothing found.
   */

  /**
   * Return calibration, and distance, which is the closest to the
   * given key (see {@linkcode CalibrationClient~getId}).
   *
   * @function CalibrationServer~load
   * @param {Object} params
   * @param {String} params.id key used for look-up
   * @returns {CalibrationServer~loadReturn}
   */
  proto$0.load = function(params) {
    var ret = {
      calibration: {},
      distance: Infinity
    };

    if(typeof this.persistent.data !== 'undefined'
       && typeof params !== 'undefined'
       && typeof params.id !== 'undefined') {
      var closest = this.levenshtein.closestKey(this.persistent.data,
                                                  params.id);
      debug('%s -> %s (%s)', params.id, closest.key, closest.distance);

      var data = this.persistent.data[closest.key];
      if(typeof data !== 'undefined') {
        for(var c in data) {
          if(data.hasOwnProperty(c) ) {
            // retrieve last value
            ret.calibration[c] = data[c].slice(-1)[0][1];
            ret.distance = closest.distance;
          }
        }
      }
    }
    return ret;
  };

MIXIN$0(CalibrationServer.prototype,proto$0);proto$0=void 0;return CalibrationServer;})(); // class CalibrationServer

module.exports = exports = CalibrationServer;
