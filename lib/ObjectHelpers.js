var _ = require('lodash');

//TODO tests.

function deepSet(object, keypath, value) {
  if (!_.isObject(object)) {
    throw new Error('deepSet traversing a non-object.');
  }

  if (keypath.length === 0) {
    throw new Error('deepSet given empty keypath, makes no sense.');
  }

  var curKey = keypath[0];
  if (keypath.length === 1) {
    object[curKey] = value;
  } else {
    // Need to traverse. Instantiate blank objects
    // as needed.
    if (object.hasOwnProperty(curKey)) {
      if (!_.isObject(object[curKey])) {
        throw new Error('deepSet traversing a non-object.');
      }
    } else {
      object[curKey] = {};
    }

    deepSet(object[curKey], _.rest(keypath), value);
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

module.exports = {
  deepSet: deepSet,
  deepGet: deepGet
};
