process.on('message', function() {
  worker.data('foo');
  throw new Error('outside-splody');
});
