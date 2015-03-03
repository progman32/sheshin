module.exports.decorate = function(Rx) {
  // The combination of combineLatest and subscribe. Allows terse
  // expression of side-effects that require notification if any
  // observables change.
  // This is akin to combineLatest with guaranteed side effects.
  // The subscription function (always the last argument) gets
  // called with 'this' set to the array of observables.
  Rx.Observable.subscribeLatest = function() {
      var args = Array.prototype.slice.call(arguments);
      var resultSubscription = args.pop();

      return Rx.Observable.combineLatest(args, function() {
        return arguments;
      }).subscribe(function(vals) {
        resultSubscription.apply(args, vals);
      });
  };

  // Prints out the activity of the sequence to the console.
  // For debugging purposes. Can pass in an optional name
  // for this sequence to help clarify the output.
  Rx.Observable.prototype.dump = function(optionalName) {
    var name = optionalName ?
      (optionalName + ' ') :
      '';

    return this.subscribe(
      function(value) {
        console.log(name + 'onNext: ', value);
      },
      function(error) {
        console.log(name + 'onError: ', error);
      },
      function() {
        console.log(name + 'completed');
      }
    );
  }
};
