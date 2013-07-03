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
  it('should handle missing files', function(done) {
    var pool = new ChildPool('/404-worker');

    pool.send('bar', function(err, data) {
      assert.equal(err.message, 'Cannot find module \'/404-worker\'');
      done();
    });
  });

  it('should kill idle workers', function(done) {
    var pool = new ChildPool(__dirname + '/artifacts/child-worker', {workers: 2, keepAlive: 10});
    exec(2, pool, function() {
      setTimeout(function() {
        assert.equal(pool.workers.length, 0);
        done();
      }, 50);
    });
  });

  it('should dispatch to all workers', function(done) {
    var pool = new ChildPool(__dirname + '/artifacts/waiting-worker', {workers: 2});
    exec(2, pool, done);
    pool.sendAll('quit');
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
    it('should share the global limit', function(done) {
      var numCPUs = require('os').cpus().length,
          pool1 = new ChildPool(__dirname + '/artifacts/child-worker', {workers: numCPUs+2}),
          pool2 = new ChildPool(__dirname + '/artifacts/child-worker', {workers: numCPUs+2});

      exec(numCPUs-2, pool1, poolDone);
      exec(numCPUs-2, pool2, poolDone);

      var count = 0;
      function poolDone() {
        count++;
        if (count === 2) {
          done();
        }
      }
      assert.equal(pool1.workers.length, numCPUs-2);
      assert.equal(pool2.workers.length, 2);
    });
    it('should continue after saturated global limit', function(done) {
      var numCPUs = require('os').cpus().length,
          pool1 = new ChildPool(__dirname + '/artifacts/child-worker', {workers: numCPUs+2}),
          pool2 = new ChildPool(__dirname + '/artifacts/child-worker', {workers: numCPUs+2});

      exec(numCPUs+2, pool1, poolDone);
      exec(numCPUs+2, pool2, poolDone);

      var count = 0;
      function poolDone() {
        count++;
        if (count === 2) {
          done();
        }
      }
      assert.equal(pool1.workers.length, numCPUs);
      assert.equal(pool2.workers.length, 0);
    });
  });

  describe('worker', function() {
    it('should expose message API');
    it('should expose error API');

    it('should notify parent of errors');
    it('should notify parent of exceptions');
  });
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
