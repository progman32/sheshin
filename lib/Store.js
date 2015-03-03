var Backing = require('./Backing');
var _ = require('lodash');

/**
 * An arbitrary-depth hierarchical key-value store which
 * provides change notifications at any level.
 *
 * Exposes a read-only API for consumers of data, and a private write API
 * provided via callback to the code calling Store's constructor.
 * The intent is for the code instantiating a Store to mediate writes itself.
 *
 * Sheshin - Knowing.
 */

var Store = function(callback) {
  var backing = new Backing();

  // Generate the private write API,
  // and furnish it to the callback.
  callback({
    set: _.bind(backing.set, backing)
  });

  // Generate the read API.
  this.observe = _.bind(backing.observe, backing);
};

module.exports = Store;
