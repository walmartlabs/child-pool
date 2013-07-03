process.on('message', function(data) {
  process.send({data: {data: 'foo', input: data}});
});
