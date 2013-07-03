# Child Pool

`child_process` pool implementation suporting:

- Global and per-pool worker limits
- Background vs. foreground execution mode
- Integrated error handling

## Usage

### Pool
```
 var ChildPool = require('./child-pool');

ChildPool.isBackground(true);

var worker = new ChildPool(__dirname + '/child-worker', options);
worker.send({foo: 'bar'}, function() {
});
```

Options:

- `workers`: Number of workers that might be spawned. Defaults to # CPUs.
- `keepAlive`: Time duration in ms to keep idle workers alive. Defaults to 500ms.

#### #send(message, callback)

Queues `message` for the worker, calling `callback` upon competion.

#### #sendAll(message)

Broadcasts `message` to all live workers immediately.


## Global worker limit

Undermost circumstances, the library will not spawn more than the number of CPUs across the entire node instance. The exceptions are:

- `ChildPool.isBackground` has been called with a truthy value

  Forces the library to not spawn more than #CPUs - 1. To ensure that there is a process open for interactive processes.

- When there is only one CPU core

  The library will still spawn two workers.

The global worker limit constrains any values that might have been passed in the pool initialization options.
