/**
 * @fileoverview Server-side calibration component
 * @author Jean-Philippe.Lambert@ircam.fr
 * @copyright 2015 IRCAM, Paris, France
 * @license BSD-3-Clause
 */

'use strict';

const debug = require('debug')('soundworks:server:calibration');
const fs = require('fs');
const path = require('path');
const string = require('../common/string');

class CalibrationServer {
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
  constructor(params = { persistent: {} }) {
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
      const data = fs.readFileSync(this.persistent.file,
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
  }

  /**
   * Start a calibration process by registering the send and receive
   * functions.
   *
   * @function CalibrationServer~start
   * @param {CalibrationServer~sendFunction} sendFunction
   * @param {CalibrationServer~receiveFunction} receiveFunction
   */
  start(sendFunction, receiveFunction) {
    // register receive functions
    receiveFunction('calibration:load', (params) => {
      const {calibration, distance} = this.load(params);
      if(distance < Infinity) {
        sendFunction('calibration:set', calibration);
      }
    });

    receiveFunction('calibration:save', (params) => {
      this.save(params);
    });
  }

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
  save(params) {
    let writeFile = false;
    if(typeof params !== 'undefined'
       && typeof params.id !== 'undefined'
       && typeof params.calibration !== 'undefined') {
      const date = new Date();

      for(let c in params.calibration) {
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
  }

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
  load(params) {
    let ret = {
      calibration: {},
      distance: Infinity
    };

    if(typeof this.persistent.data !== 'undefined'
       && typeof params !== 'undefined'
       && typeof params.id !== 'undefined') {
      const closest = this.levenshtein.closestKey(this.persistent.data,
                                                  params.id);
      debug('%s -> %s (%s)', params.id, closest.key, closest.distance);

      const data = this.persistent.data[closest.key];
      if(typeof data !== 'undefined') {
        for(let c in data) {
          if(data.hasOwnProperty(c) ) {
            // retrieve last value
            ret.calibration[c] = data[c].slice(-1)[0][1];
            ret.distance = closest.distance;
          }
        }
      }
    }
    return ret;
  }

} // class CalibrationServer

module.exports = exports = CalibrationServer;
