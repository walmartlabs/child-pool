var run = false;

process.on('message', function(msg) {
  if (run || msg === 'quit') {
    run = true;
    worker.data({});
  }
});
