global.worker = {
  data: function(data) {
    process.send({data: data});
  },
  error: function(err) {
    process.send({err: err.message || err, stack: err.stack || new Error().stack});
  },
  fatal: function(err) {
    process.send({err: err.message || err, stack: err.stack || new Error().stack, fatal: true});
  }
};

process.on('uncaughtException', function(err) {
  worker.fatal(err);
});

process.once('message', function(module) {
  require(module);
});
