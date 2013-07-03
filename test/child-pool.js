var assert = require('assert'),
    ChildPool = require('../lib/child-pool');

describe('child-pool', function() {
  it('should run child', function(done) {
    var pool = new ChildPool(__dirname + '/artifacts/child-worker');

    pool.send('bar', function(err, data) {
      assert.equal(err, undefined);
      assert.deepEqual(data, {data: 'foo', input: 'bar'});
      done();
    });
  });

  describe('limit', function() {
    it('should run up to pool limit');
    it('should run up to global limit');
  });

  it('should kill idle workers');

  describe('worker', function() {
    it('should expose message API');
    it('should expose error API');

    it('should notify parent of errors');
    it('should notify parent of exceptions');

    describe('console', function() {
      it('should forward console.log');
      it('should forward console.error');
    });
  });
});
