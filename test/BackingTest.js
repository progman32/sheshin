var Backing = require('../lib/Backing');

var expect = require('chai').expect;
var Rx = require('rx');
require('../lib/RxExtensions').decorate(Rx);

describe('Backing', function() {
  var instance;

  beforeEach(function() {
    instance = new Backing();
  });

  describe('observe', function() {
    it('should provide the last set value', function(done) {
      instance.set('prop', 10);

      instance.observe('prop').take(1).subscribe(function(value) {
        expect(value).to.equal(10);
        done();
      });
    });

    it('should notify on the property being set', function(done) {
      instance.observe('prop').take(2).toArray().subscribe(function(values) {
        expect(values).to.deep.equal([1, 2]);
        done();
      });

      instance.set('prop', 1);
      instance.set('prop', 2);
    });

    it('should notify on the parents of the property being set', function(done) {
      var doneSignal = new Rx.Subject();

      Rx.Observable.subscribeLatest(
        instance.observe('parent').takeUntil(doneSignal).toArray(),
        instance.observe('parent.child').takeUntil(doneSignal).toArray(),
        instance.observe('parent.child.grandchild').takeUntil(doneSignal).toArray(),
        instance.observe('parent.child.grandchild.greatGrandchild').takeUntil(doneSignal).toArray(),
        function(onParent, onChild, onGrandchild, onGreatGrandchild) {
          expect(onParent).to.deep.equal([
            {
              child: {
                grandchild: 'foo'
              },
            },
            {
              child: {
                grandchild: 'bar'
              }
            },
            {
              child: 'newGrandchildScalar'
            },
            {
              child: {}
            },
            {
              child: {
                grandchild: {
                  greatGrandchild: 'omg'
                }
              }
            },
            {
              child: {
                grandchild: {
                  greatGrandchild: "that's deep man!"
                }
              }
            },
            100
          ]);

          expect(onChild).to.deep.equal([
            {
              grandchild: 'foo'
            },
            {
              grandchild: 'bar'
            },
            'newGrandchildScalar',
            {},
            {
              grandchild: {
                greatGrandchild: 'omg'
              }
            },
            {
              grandchild: {
                greatGrandchild: "that's deep man!"
              }
            },
          ]);

          expect(onGrandchild).to.deep.equal([
            'foo',
            'bar',
            {
              greatGrandchild: 'omg'
            },
            {
              greatGrandchild: "that's deep man!"
            }
          ]);

          expect(onGreatGrandchild).to.deep.equal([
            'omg',
            "that's deep man!"
          ]);

          done();
        }
      );

      instance.set('parent.child.grandchild', 'foo');
      instance.set('parent.child.grandchild', 'bar');

      instance.set('parent.child', 'newGrandchildScalar');

      instance.set('parent.child', {});

      instance.set('parent.child.grandchild.greatGrandchild', 'omg');

      // Replace a big subtree.
      instance.set('parent', { child: { grandchild: { greatGrandchild: "that's deep man!" } } });

      instance.set('parent', 100);

      doneSignal.onNext();

    });

    it('should throw immediately when trying to traverse a scalar on set()', function() {
      instance.set('parent.child.grandchild', 'foo');
      instance.set('parent.child', 'newGrandchildScalar');
      expect(function() {
        instance.set('parent.child.bad', 100);
      }).to.throw();
    });

    describe('on the root', function() {

      it('should notify on any property being set', function(done) {
        var doneSignal = new Rx.Subject();

        instance.observe().takeUntil(doneSignal).toArray().subscribe(
          function(onRoot) {
            expect(onRoot).to.deep.equal([
              {},
              {
                parent: {
                  child: {
                    grandchild: 'foo'
                  }
                }
              },
              {
                parent: {
                  child: {
                    grandchild: 'bar'
                  }
                }
              },
              {
                parent: {
                  child: 'newGrandchildScalar'
                }
              },
              {
                parent: {
                  child: {}
                }
              },
              {
                parent:{
                  child: {
                    grandchild: 'omg'
                  }
                }
              }
            ]);
            done();
          }
        );

        instance.set('parent.child.grandchild', 'foo');
        instance.set('parent.child.grandchild', 'bar');

        instance.set('parent.child', 'newGrandchildScalar');

        instance.set('parent.child', {});

        instance.set('parent.child.grandchild', 'omg');

        doneSignal.onNext();

      });

    });
  });
});
