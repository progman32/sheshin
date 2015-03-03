/**
 * A hierarchical key-value store capable of providing
 * change notifications at any depth.
 *
 * Trenpa - Recollection.
 */

var ObjectHelpers = require('./ObjectHelpers');
var Rx = require('rx');
var _ = require('lodash');

var Backing = function() {
  var self = this;

  // All writes to this Backing.
  // Seq of objects:
  // {
  //   keypath: array of path components.
  //   value: new value written to the given path.
  // }
  self.writes = new Rx.Subject();

  // Sequence of truths: entire tree and reason tree last updated.
  // {
  //   truth: Entire tree, latest version.
  //   cause: Keypath (as array) of last write.
  // }
  self._truths = self.writes.scan(
    { truth: {}, cause: [] },
    function(acc, write) {
      var theNextGeneration = _.cloneDeep(acc.truth);
      ObjectHelpers.deepSet(theNextGeneration, write.keypath, write.value);
      return {
        truth: theNextGeneration,
        cause: write.keypath
      };
    }
  );

  self._currentTruth = {};
  self._truths.pluck('truth').subscribe(function(currentTruth) {
    self._currentTruth = currentTruth;
  });
};

Backing.prototype.set = function(keypath, value) {
  this.writes.onNext({keypath: keypath.split('.'), value: value});
};


function isBlobWriteInSubtree(keypath) {
  return function(blobWrite) {
    var theirPath = blobWrite.cause.join('.');
    return theirPath.indexOf(keypath) === 0;
  };
}

Backing.prototype.observe = function(keypath) {
  var splitKeypath = keypath ? keypath.split('.') : [];
  var head = ObjectHelpers.deepGet(
    this._currentTruth,
    splitKeypath,
    function(value) {
      // Got a value.
      return Rx.Observable.returnValue(value);
    },
    function() {
      // No value.
      return Rx.Observable.empty();
    }
  );
  return head.
  concat(
    this._truths.
    filter(isBlobWriteInSubtree(keypath || '')).
    flatMap(function(blobWrite) {
      return ObjectHelpers.deepGet(
        blobWrite.truth,
        splitKeypath,
        function(value) {
          return Rx.Observable.returnValue(value);
        },
        _.constant(Rx.Observable.never())
      );
    })
  );
    
};

module.exports = Backing;
