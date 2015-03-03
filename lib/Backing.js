/**
 * Holds data, fronted and protected by Store.
 * Trenpa - recollection.
 */

var Rx = require('rx');
var _ = require('lodash');

function deepWrite(object, keypath, value) {
  var curKey = keypath[0];
  if (!_.isObject(object)) {
    throw new Error('deepWrite traversing a non-object.');
  } else {
    if (keypath.length === 1) {
      object[curKey] = value;
    } else {
      if (object.hasOwnProperty(curKey)) {
        var nextLevel = object[curKey];
        if (!_.isObject(nextLevel)) {
          throw new Error('deepWrite traversing a non-object.');
        } else {
          deepWrite(object[curKey], _.rest(keypath), value);
        }
      } else {
        object[curKey] = {};
        deepWrite(object[curKey], _.rest(keypath), value);
      }
    }
  }
}

function deepGet(object, keypath, gotValueCallback, noValueCallback) {
  if (_.isEmpty(keypath)) {
    return gotValueCallback(object);
  }

  var thisLevelKey = keypath[0];
  if (keypath.length === 1) {
    if (object.hasOwnProperty(thisLevelKey)) {
      return gotValueCallback(object[thisLevelKey]);
    } else {
      return noValueCallback();
    }
  } else {
    if (object.hasOwnProperty(thisLevelKey)) {
      return deepGet(object[thisLevelKey], _.rest(keypath), gotValueCallback, noValueCallback);
    } else {
      return noValueCallback();
    }
  }
}

var Backing = function() {
  var self = this;

  var data = {};

  var rootSubject = new Rx.Subject();
  self.listenerTree = {
    subject: rootSubject,
    children: {}
  };

  self.writes = new Rx.Subject();

  var blobs = self.writes.scan(
    {blob:{}, cause: []},
    function(acc, write) {
      var theNextGeneration = _.cloneDeep(acc.blob);
      deepWrite(theNextGeneration, write.keypath, write.value);
      return {
        blob: theNextGeneration,
        cause: write.keypath
      };
    }
  );

  self.blobs = blobs;
  self._currentBlob = {};
  blobs.subscribe(function(currentBlob) {
    self._currentBlob = currentBlob.blob;
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
    this._currentBlob,
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
    this.blobs.
    filter(isBlobWriteInSubtree(keypath || '')).
    flatMap(function(blobWrite) {
      return deepGet(
        blobWrite.blob,
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
