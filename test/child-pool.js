var assert = require('assert'),
    ChildPool = require('../lib/child-pool');

describe('child-pool', function() {
  beforeEach(function() {
    ChildPool.isBackground(false);
  });

  it('should run child', function(done) {
    var pool = new ChildPool(__dirname + '/artifacts/child-worker');

    pool.send('bar', function(err, data) {
      assert.equal(err, undefined);
      assert.deepEqual(data, {data: 'foo', input: 'bar'});
      done();
    });
  });

  describe('limit', function() {
    it('should run up to pool limit', function(done) {
      var pool = new ChildPool(__dirname + '/artifacts/child-worker', {workers: 2});

      exec(10, pool, done);
      assert.equal(pool.workers.length, 2);
    });
    it('should run up to global limit', function(done) {
      var numCPUs = require('os').cpus().length,
          pool = new ChildPool(__dirname + '/artifacts/child-worker', {workers: numCPUs+2});

      exec(numCPUs+2, pool, done);
      assert.equal(pool.workers.length, numCPUs);
    });
    it('should run up to the global background limit', function(done) {
      var numCPUs = require('os').cpus().length,
          pool = new ChildPool(__dirname + '/artifacts/child-worker', {workers: numCPUs+2});

      ChildPool.isBackground(true);

      exec(numCPUs+2, pool, done);
      assert.equal(pool.workers.length, numCPUs-1);
    });

    function exec(execCount, pool, done) {
      var seenCount = 0;

      for (var i = 0; i < execCount; i++) {
        pool.send('bar', function(err, data) {
          seenCount++;

          if (seenCount === execCount) {
            done();
          } else if (seenCount > execCount) {
            assert.fail('Too many responses');
          }
        });
      }
    }
  });

  it('should kill idle workers');

  describe('worker', function() {
    it('should expose message API');
    it('should expose error API');

    it('should notify parent of errors');
    it('should notify parent of exceptions');
  });
});
