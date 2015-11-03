/**
 * @fileOverview calibration object definition
 * @author Jean-Philippe.Lambert@ircam.fr
 * @copyright 2015 IRCAM, Paris, France
 * @license BSD-3-Clause
 */

'use strict';

/**
 * This object may not define all properties, like network
 * statistics. In particular, it could be the empty object {} if no
 * calibration is available.
 *
 * @typedef {Object} calibration
 * @property {Object} audio
 * @property {Number} audio.delay in seconds
 * @property {Number} audio.gain in dB
 * @property {Object} network
 * @property {Number} network.delay in seconds
 * @property {Number} network.delayMax in seconds
 **/

