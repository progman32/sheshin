var Store = require('../lib/Store');

var expect = require('chai').expect;
var Rx = require('rx');
require('../lib/RxExtensions').decorate(Rx);

describe('Store', function() {
  var instance;
  var privateWriteApi;

  beforeEach(function() {
    instance = new Store(function(api) {
      privateWriteApi = api;
    });
  });
  it('should provide a private write API', function() {
    expect(privateWriteApi).to.have.property('set');
    expect(privateWriteApi.set).to.be.a.function;
  });

  describe('public read API', function() {
    it('should reflect calls to the private write API', function(done) {
      // Most tricky set() behavior is tested in BackingTest.
      // This is just to make sure the piping works between public/private API.
      privateWriteApi.set('prop', 1);

      instance.observe('prop').take(2).toArray().subscribe(function(values) {
        expect(values).to.deep.equal([1, 2]);
        done();
      });

      privateWriteApi.set('prop', 2);
      
    });
  });
});
