# Dico

Dico is a simple dependency injection container in javascript. Here is a simple presentation. You can get more complete documentation on the [website](http://guilro.github.com/dico).

# Installation

```bash
$ npm install dico
```

## Usage

Require it your code :
```js
var dico = require('dico');
container = dico('myApp');
```

The container object has three methods, `get`, `set` and `load`, for managing parameters and services. In simple cases, you can `set` manually parameters and services, but if you use a dependency injector, you would probably want to load it from a JSON config file.

### Parameters
```js
container.set('param', 'paramValue');
container.get('param'); // return 'paramValue'
```

### Services
To define services, just pass a function as a parameter. The function will get the container as the first parameter and a callback as the second. A service can be any object useful to your app and/or to other services.

```js
container.set('myService', function(c, cb) {
  // get params from container
  var param1 = c.get('param1');
  // create service object with those params
  // ...

  return cb(null, service);
});

container.get('@myService', function(err, service) {
  service.doStuff();
});
```

To get the service, just put `@` before its name. If you do `container.get('myService')`, it will return the service creation function and not the service itself.

With the container being passed, you can access other services and parameters inside the service creation function. Dependencies are injected this way.

Note that services are only instantiated when requested, so the order of definition does not matter.

### Loading from parsed JSON

You can use `container.load(config, basedir)` to define many services quickly. This is in fact perhaps the most convenient way to proceed.

Learn more reading the doc on the [website](http://guilro.github.io/dico/#loading-from-json).

### Namespacing

Containers which are passed to service creation functions are slightly modified. Parameters setted via load or in a service creation function are prefixed with the same of the service, separated by a dot. Each time you try to access a parameter or a service from a container passed to a service creation function, it first look in the local namespace before the global.

It will more likely be completely transparent if you do not use this feature.

Learn more reading the doc on the [website](http://guilro.github.io/dico/#namespacing).
