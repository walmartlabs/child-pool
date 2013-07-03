process.on('message', function(data) {
  worker.data({data: 'foo', input: data});
});
