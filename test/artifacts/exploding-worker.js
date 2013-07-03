process.on('message', function() {
  throw new Error('esplody');
});
