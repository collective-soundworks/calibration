/**
 * @fileOverview Levenshtein distance for strings
 * @author Jean-Philippe.Lambert@ircam.fr
 * @copyright 2015 IRCAM, Paris, France
 * @license BSD-3-Clause
 */

'use strict';

var string = {};

// code from Marco de Wit http://stackoverflow.com/a/18514751
string.Levenshtein = ((function(){"use strict";var PRS$0 = (function(o,t){o["__proto__"]={"a":t};return o["a"]===t})({},{});var DP$0 = Object.defineProperty;var GOPD$0 = Object.getOwnPropertyDescriptor;var MIXIN$0 = function(t,s){for(var p in s){if(s.hasOwnProperty(p)){DP$0(t,p,GOPD$0(s,p));}}return t};var proto$0={};
  /**
   * This is the constructor, used to cache the strings.
   *
   * See {@linkcode string.Levenshtein~distance} method to actually
   * compute the distance.
   *
   * @constructs string.Levenshtein
   */
  function constructor$0() {
    this.cache = [];
  }DP$0(constructor$0,"prototype",{"configurable":false,"enumerable":false,"writable":false});

  /**
   * Levenshtein distance of 2 strings.
   *
   * 0 is the minimum distance, meaning that s1 === s2
   *
   * @function string.Levenshtein~distance
   * @param {String} s1
   * @param {String} s2
   * @returns {Number} distance
   */
  proto$0.distance = function(s1, s2) {
    if (s1 === s2) {
      return 0;
    } else {
      var s1Length = s1.length;
      var s2Length = s2.length;
      if (s1Length && s2Length) {
        var i1 = 0;
        var i2 = 0;
        var a, b, c, c2;
        var row = this.cache;
        while (i1 < s1Length) {
          row[i1] = ++i1;
        }
        while (i2 < s2Length) {
          c2 = s2.charCodeAt(i2);
          a = i2;
          ++i2;
          b = i2;
          for (i1 = 0; i1 < s1Length; ++i1) {
            c = a + (s1.charCodeAt(i1) === c2 ? 0 : 1);
            a = row[i1];
            b = b < a ? (b < c ? b + 1 : c) : (a < c ? a + 1 : c);
            row[i1] = b;
          }
        }
        return b;
      } else {
        return s1Length + s2Length;
      }
    }
  };

  /**
   * @typedef string.Levenshtein~closestKeyReturn
   * @type {Object}
   * @property {String} key closest to query
   * @property {Number} distance corresponding distance of result.key
   */

  /**
   * Find the key in an object, which is the closest to the query,
   * according to their Levenshtein distance.
   *
   * @see {@linkcode string.Levenshtein~distance}
   *
   * @function string.Levenshtein~closestKey
   * @param {Object} object
   * @param {String} query
   * @returns {string.Levenshtein~closestKeyReturn} result closest to query
   */
  proto$0.closestKey = function(object, query) {
    if(object.hasOwnProperty(query) ) {
      return {
        key: query,
        distance: 0
      };
    } else {
      var key;
      var distance = Infinity;

      for(var k in object) {
        if(object.hasOwnProperty(k) ) {
          var d = this.distance(query, k);
          if(d < distance) {
            distance = d;
            key = k;
          }
          if(distance === 0) {
            break;
          }
        }
      }
      return {
        key: key,
        distance: distance
      };
    }
  };

MIXIN$0(constructor$0.prototype,proto$0);proto$0=void 0;return constructor$0;})());

module.exports = exports = string;
