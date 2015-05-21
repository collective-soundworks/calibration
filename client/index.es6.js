/**
 * @fileOverview Client-side calibration component
 * @author Jean-Philippe.Lambert@ircam.fr
 */

'use strict';

const debug = require('debug')('soundworks:client:calibration');
const platform = require('platform');

// calibration~calibration type definition
const calibrationType = require('../common/calibration');

class CalibrationClient {
  /**
   * This is the constructor. See {@linkcode CalibrationClient~save}
   * and {@linkcode CalibrationClient~load}
   *
   * @constructs CalibrationClient
   * @param {Object} [localStorage]
   * @param {Boolean} [localStorage.enabled=false] true to try to use
   * local storage.
   * @param {String} [localStorage.prefix='soundworks:calibration.']
   */
  constructor(params = { localStorage: {} }) {
    this.localStorage = {};
    this.localStorage.enabled = (typeof params.localStorage.enabled !== 'undefined'
                                 ? params.localStorage.enabled
                                 : true);
    // localStorage is requested
    if(this.localStorage.enabled) {
      this.localStorage.data = {};
      this.localStorage.prefix = (typeof params.localStorage.prefix !== 'undefined'
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
      this.audio.outputs = ['internal', 'external'];
      this.network = {};
    }
  }

  /**
   * Get an identifier for making a request on the server.
   *
   * @see {@linkcode CalibrationServer~request}
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
   * Set audio calibration from given values.
   *
   * Non audio parameters (like network statistics) are not set.
   *
   * @function CalibrationClient~set
   * @param {calibration} restoreParams
   */
  set(params) {
    if(typeof params !== 'undefined') {
      if(typeof params.audio !== 'undefined') {
        for(let o of this.audio.outputs) {
          if(params.audio.hasOwnProperty(o) ) {
            this.audio[o] = params.audio[o];
          }
        }
      }
    }
  }

  /**
   * Store the current calibration locally, if localStorage is
   * enabled.
   *
   * See {@linkcode CalibrationClient~set} to change the current calibration.
   *
   * @function CalibrationClient~save
   */
  save() {
    const params = {};
    for(let o of this.audio.outputs) {
      if(typeof this.audio[o] !== 'undefined') {
        if(typeof params.audio === 'undefined') {
          params.audio = {};
        }
        params.audio[o] = this.audio[o];
      }
    }
    params.network = this.network;

    const keys = ['audio', 'network'];
    if(this.localStorage.enabled) {
      try {
        for(let k of keys) {
          if(typeof params[k] !== 'undefined') {
            window.localStorage[this.localStorage.prefix + k]
              = JSON.stringify(params[k]);
          }
        }
      } catch (error) {
        console.log(error.message);
        this.localStorage.enabled = false;
      }
    }
    return this.localStorage.enabled;
  }

  /**
   * Return calibration values from local storage, if enabled and
   * available.
   *
   * Note that it does not set it. See {@linkcode
   * CalibrationClient~set}.
   *
   * @function CalibrationClient~load
   * @returns {calibration} or {} if no calibration is available
   */
  load() {
    let calibration = {};
    if(this.localStorage.enabled) {
      const keys = ['audio', 'network'];
      for(let k in keys) {
        if(typeof window.localStorage[this.localStorage.prefix + k]
           !== 'undefined') {
          calibration[k] = JSON.parse(
            window.localStorage[this.localStorage.prefix + k]);
        }
      }
    }
    return calibration;
  }

}

module.exports = CalibrationClient;