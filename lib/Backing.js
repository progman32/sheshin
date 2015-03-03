/**
 * A hierarchical key-value store capable of providing
 * change notifications at any depth.
 *
 * Trenpa - Recollection.
 */

var Rx = require('rx');
var _ = require('lodash');

function deepWrite(object, keypath, value) {
  if (!_.isObject(object)) {
    throw new Error('deepWrite traversing a non-object.');
  }

  if (keypath.length === 0) {
    throw new Error('deepWrite given empty keypath, makes no sense.');
  }

  var curKey = keypath[0];
  if (keypath.length === 1) {
    object[curKey] = value;
  } else {
    // Need to traverse. Instantiate blank objects
    // as needed.
    if (object.hasOwnProperty(curKey)) {
      if (!_.isObject(object[curKey])) {
        throw new Error('deepWrite traversing a non-object.');
      }
    } else {
      object[curKey] = {};
    }

    deepWrite(object[curKey], _.rest(keypath), value);
  }
}

function deepGet(object, keypath, gotValueCallback, noValueCallback) {
  if (_.isEmpty(keypath)) {
    return gotValueCallback(object);
  }

  if (!_.isObject(object)) {
    // Could be an error, consider more carefully.
    return noValueCallback();
  }

  var thisLevelKey = keypath[0];
  var hasOwn = object.hasOwnProperty(thisLevelKey);
  var nextLevel = object[thisLevelKey];

  if (hasOwn) {
    if (keypath.length === 1) {
      return gotValueCallback(nextLevel);
    } else {
      return deepGet(nextLevel, _.rest(keypath), gotValueCallback, noValueCallback);
    }
  } else {
    return noValueCallback();
  }
}

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
      deepWrite(theNextGeneration, write.keypath, write.value);
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
  var head = deepGet(
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
      return deepGet(
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
