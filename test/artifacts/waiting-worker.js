process.on('message', function(msg) {
  if (msg === 'quit') {
    process.send({});
  }
});
