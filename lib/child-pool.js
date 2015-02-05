var _ = require('underscore'),
    cp = require('child_process'),
    EventEmitter = require('events').EventEmitter,
    util = require('util');

var numCPUs = require('os').cpus().length,
    queue = [],
    activeTasks = 0,
    totalWorkers = 0,
    isBackground;

exports = module.exports = function(module, options) {
  EventEmitter.call(this);

  this.module = module;
  this.options = _.extend({workers: numCPUs, keepAlive: 500}, options);
  this.workers = [];
  this.totalWorkers = 0;
  this.cullTimeout = undefined;
};
util.inherits(exports, EventEmitter);

exports.prototype.sendAll = function(message) {
  _.each(this.workers, function(worker) {
    worker.process.send(message);
  });
};
exports.prototype.send = function(message, callback) {
  var self = this;

  callback = callback || function() {};

  function fork() {
    totalWorkers++;
    self.totalWorkers++;

    var execArgv = process.execArgv;
    if (_.contains(execArgv, '--prof')) {
      execArgv = _.clone(execArgv);

      var logFile = _.find(execArgv, function(arg) { return /^--logfile=.*/.test(arg); }) || '--logfile=v8.log',
          location = execArgv.indexOf(logFile);

      if (self.options.logId) {
        logFile = logFile + '.' + self.options.logId + '.' + self.totalWorkers;
      } else {
        logFile = logFile + '.' + totalWorkers;
      }
      if (location >= 0) {
        execArgv.splice(location, 1, logFile);
      } else {
        execArgv.push(logFile);
      }
    }

    // Node 0.11 supports passing the execArgv option to fork but we don't want to break compatibility
    // so we're going to emulate the fork logic in the mean time.
    worker = {
      callback: false,
      process: cp.spawn(
          process.execPath,
          execArgv.concat([__dirname + '/worker'], execArgv),
          {stdio: [0, 1, 2, 'ipc']})
    };
    worker.process.send(self.module);
    function processMessage(msg) {
      activeTasks--;

      var callback = worker.callback;
      worker.callback = undefined;

      // Check for process culling
      worker.cullTimeout = setTimeout(function() {
        // Kill
        worker.process.kill();
        self.workers = _.without(self.workers, worker);
      }, self.options.keepAlive);

      if (queue.length) {
        var queued = queue.shift();
        queued.pool.send(queued.message, queued.callback);
      }

      // Dispatch
      process.nextTick(function() {
        var err;
        if (msg.err) {
          err = new Error(msg.err);
          if (msg.stack) {
            err.stack = msg.stack;
          }
        }

        // Kill the worker as we don't know what state it might be in
        if (msg.fatal) {
          worker.process.kill();
          self.workers = _.without(self.workers, worker);
        }

        if (!callback) {
          self.emit('error', err || new Error('Out of band data: ' + msg.data));
        } else {
          callback(err, msg.data);
        }
      });
    }

    worker.process.on('exit', function (code, signal) {
      if (code === null) {
        //process wasn't killed properly
        var error = new Error('Worker exited unexpectedly');
        processMessage({
          fatal: true,
          err: error.message,
          stack: error.stack
        });
      }
    });
    worker.process.on('message', processMessage);
    self.workers.push(worker);
  }

  // If we are in interactive mode, i.e. watch, leave at least one core free so the machine doesn't
  // lag and annoy the developer.
  // Creating a minimum number of CPUs to prevent starvation on machines with less cores
  var exceedsGlobal = (activeTasks + (isBackground ? 1 : 0) >= Math.max(numCPUs, 2)),
      worker = !exceedsGlobal && _.find(this.workers, function(worker) { return !worker.callback; });
  if (!worker) {
    if (!exceedsGlobal && this.workers.length < this.options.workers) {
      // Fork!
      fork();
    } else {
      // Queue!
      queue.push({pool: self, message: message, callback: callback});
      return;
    }
  }

  activeTasks++;

  clearTimeout(worker.cullTimeout);
  worker.callback = callback;
  worker.process.send(message);
};

/**
 * Set to true to attempt to leave at least one core available to prevent starvation.
 *
 * This is useful for watch mode when the developer might be doing other things while the build is
 * running.
 */
exports.isBackground = function(background) {
  isBackground = background;
};
