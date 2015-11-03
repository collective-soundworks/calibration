/**
 * @fileOverview Client-side calibration component
 * @author Jean-Philippe.Lambert@ircam.fr
 * @copyright 2015 IRCAM, Paris, France
 * @license BSD-3-Clause
 */

'use strict';

const debug = require('debug')('soundworks:client:calibration');
const platform = require('platform');

// calibration~calibration type definition
const calibrationType = require('../common/calibration');

class CalibrationClient {
   /**
   * @callback CalibrationClient~sendFunction
   * @see {@linkcode CalibrationServer~receiveFunction}
   * @param {String} messageType identification of ping message type
   * @param {Object} params
   **/

  /**
   * @callback CalibrationClient~receiveFunction
   * @see {@linkcode CalibrationServer~sendFunction}
   * @param {String} messageType identification of pong message type
   * @param {SyncClient~receiveCallback} receiveCallback called on
   * each message matching messageType.
   **/

  /**
   * @callback CalibrationClient~receiveCallback
   * @param {...Any} arguments
   */

  /**
   * Function called when an update happened.
   *
   * See {@linkcode ClientCalibration~load}.
   *
   * @callback ClientCalibration~updateFunction
   **/

  /**
   * This is the constructor. See {@linkcode CalibrationClient~save}
   * and {@linkcode CalibrationClient~load}
   *
   * @constructs CalibrationClient
   * @param {Object} [params]
   * @param {Object} [params.localStorage]
   * @param {Boolean} [params.localStorage.enabled=false] true to try to use
   * local storage.
   * @param {String} [params.localStorage.prefix='soundworks:calibration.']
   * @param {ClientCalibration~updateFunction} [param.updateFunction]
   */
  constructor(params = {}) {
    this.sendFunction = params.sendFunction; // undefined is fine
    this.receiveFunction = params.receiveFunction; // undefined is fine
    this.updateFunction = params.updateFunction; // undefined is fine

    this.localStorage = {};
    this.localStorage.enabled = (typeof params.localStorage !== 'undefined'
                                 && typeof params.localStorage.enabled !== 'undefined'
                                 ? params.localStorage.enabled
                                 : true);
    // localStorage is requested
    if(this.localStorage.enabled) {
      this.localStorage.data = {};
      this.localStorage.prefix = (typeof params.localStorage !== 'undefined'
                                  && typeof params.localStorage.prefix !== 'undefined'
                                  ? params.localStorage.prefix
                                  : 'soundworks:calibration.');
      this.localStorage.enabled = typeof window.localStorage !== 'undefined';
      if(this.localStorage.enabled) {
        try {
          window.localStorage[this.localStorage.prefix + 'storage-enabled'] = true;
          window.localStorage.removeItem(this.localStorage.prefix + 'storage-enabled');
        } catch (error) {
          // localStorage is not available
          this.localStorage.enabled = false;
        }
      }

      this.userAgent = platform.ua;

      // calibrated attributes
      this.audio = {};
      this.network = {};
    }

    if(typeof this.receiveFunction !== 'undefined') {
      this.receiveFunction('calibration:set', (params) => {
        this.set(params);
      });
    }
  }

  /**
   * Get an identifier for making a request on the server.
   *
   * @see {@linkcode CalibrationServer~load}
   *
   * @function CalibrationClient~getId
   * @returns {String} Identifier
   */
  getId() {
    return this.userAgent;
  }

  /**
   * Get the calibrated values.
   *
   * @function CalibrationClient~get
   * @returns {calibration} calibration
   */
  get() {
    return {
      audio: this.audio,
      network: this.network
    };
  }

  /**
   * Set calibration from given values.
   *
   * @function CalibrationClient~set
   * @param {calibration} params
   */
  set(params) {
    if(typeof params !== 'undefined') {
      if(typeof params.audio !== 'undefined') {
        this.audio = params.audio;
      }
      if(typeof params.audio !== 'undefined') {
        this.network = params.network;
      }
      if(typeof this.updateFunction !== 'undefined') {
        this.updateFunction();
      }
    }
  }

  /**
   * Store the current calibration locally, if localStorage is
   * enabled, and on the server.
   *
   * See {@linkcode CalibrationClient~set} to change the current calibration.
   *
   * @function CalibrationClient~save
   */
  save() {
    const params = {
      audio: this.audio,
      network: this.network
    };
    if(this.localStorage.enabled) {
      try {
        for(let c in params) {
          if(params.hasOwnProperty(c) ) {
            window.localStorage[this.localStorage.prefix + c]
              = JSON.stringify(params[c]);
          }
        }
      } catch (error) {
        console.log(error.message);
        this.localStorage.enabled = false;
      }
    }

    this.sendFunction('calibration:save', {
      id: this.getId(),
      calibration: this.get()
    });
  }

  /**
   * Load and set calibration values from local storage, if enabled
   * and available, or from server.
   *
   * It will then call the update function if defined by the
   * constructor. Note that loading from the server is asynchronous.
   *
   * @function CalibrationClient~load
   * @returns {calibration} or {} if no calibration is available
   */
  load() {
    let calibration = {};
    if(this.localStorage.enabled) {
      const keys = ['audio', 'network'];
      for(let k of keys) {
        if(typeof window.localStorage[this.localStorage.prefix + k]
           !== 'undefined') {
          calibration[k] = JSON.parse(
            window.localStorage[this.localStorage.prefix + k]);
        }
      }
    }

    if(calibration.hasOwnProperty('audio') ) {
      this.set(calibration);
    } else {
      // restore from server
      this.sendFunction('calibration:load', { id: this.getId() } );
    }

    return calibration;
  }

}

module.exports = CalibrationClient;
