---
layout: default
title: Get Started
---

* Table of content.
{:toc}

# Dico

Dico is a simple dependency injection container in javascript.

# Installation
~~~ bash
$ npm install dico
~~~

# Usage

Require it your code :

~~~js
var dico = require('dico');
container = dico('myApp');
~~~

The container object has three methods, `get`, `set` and `load`, for managing parameters and services. In simple cases, you can `set` manually parameters and services, but if you use a dependency injector, you would probably want to load it from a JSON config file.

## Parameters
~~~js
container.set('param', 'paramValue');
container.get('param'); // return 'paramValue'
~~~

## Services
To define services, just pass a function as a parameter. The function will get the container as the first parameter and a callback as the second. A service can be any object useful to your app and/or to other services.

~~~js
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
~~~

To get the service, just put `@` before its name. If you do `container.get('myService')`, it will return the service creation function and not the service itself.

With the container being passed, you can access other services and parameters inside the service creation function. Dependencies are injected this way.

Note that services are only instantiated when requested, so the order of definition does not matter.

## Loading from JSON

You can use `container.load(config, basedir)` to define many services quickly.

~~~js
// services/config.json
{
  "database": {
    "module": "./services/database.js",
    "errorLog": "@logger",
    "host": "localhost"
  },
  "logger": {
    "module": "./services/logger.js",
  },
  "environment": "dev"
}
~~~

~~~js
// services/database.js
module.exports = function(container, cb) {
  container.get('@errorLog', function(err, logger) {
    if (err) return cb(err);

    var database = new Database();
    database.setErrorLog(logger);
    database.setEnv(container.get('environment'));

    cb(null, database);
  });
};
~~~

~~~js
// services/logger.js
module.exports = function(container, cb) {
  var logger = new Logger();
  logget.setLevel(container.get('environment'));
};
~~~

~~~js
// app.js
container.load(JSON.parse('./services/config.json'), __dirname);

container.get('@database', function(err, database) {
  database.doStuff();
})
~~~

The second parameter of `load` is the base directory where we should require the modules indicated in the config.

Each property of the config is set as a new service if it has itself a `module` property (like `logger` and `database`), and is set as a parameter otherwise (like `environment`). Services defined this way can get *local parameters*, like `errorLog` and `host` in the example, wich are not accessible from other services. (see below)

## Namespacing

Containers which are passed to service creation functions are slightly modified. Each time you try to access a parameter or a service from a container passed to a service creation function, the name of the service you are currently creating is first appended with a dot to the parameter you are requesting. Only if such a parameter is undefined, it will try to get it with the original name.

It allows you to override parameters locally if several services are using the same names for there parameters but you want to inject different parameters to those services. In the example above, `errorLog` and `host` are in fact set to `database.errorLog` and `database.host` in the container, so they do not interfer with the logger service parameters.

As we can access them from the database service creation function without writing excplicitely the namespace, it will more likely be completely transparent if you do not use this feature.

The following methods of settings services will result in the same state for the container :

* [Loading from parsed json](#loading-from-json) or from config object :

  ~~~ js
  container.load({
    'database': {
      'module': './services/database.js',
      'errorLog': '@logger',
      'host': 'localhost'
    },
    'logger': {
      'module': './services/logger.js',
    },
    'environment': 'dev'
  });
  ~~~
* Instanciate manually :

  ~~~ js
  container.set('database', require('./services/database.js'));
  container.set('database.errorLog', '@logger');
  container.set('database.host', 'localhost');

  container.set('logger', require('./services/logger.js'));

  container.set('environment': 'dev');
  ~~~

### Set local params in service creation functions

You can also set parameters inside a service creation function, and they will be namespaced.

~~~ js
dico.set('globalService', function(c, cb) {
  c.set('localService', function(c, cb) {
    var localService = { name: 'localService' };

    return cb(null, localService);
  });
  c.set('localParam', 'localParamValue');

  var globalService = { name: 'globalService' };

  return cb(null, globalService);
});

dico.get('@globalService', function(err, service) {
  typeof dico.get('localParam'); // undefined
  dico.get('globalService.localParam'); // 'localParamValue'
  dico.get('@localService', function(err, service) {
    typeof service; //undefined
  });
  dico.get('@globalService.localService', function(err, service) {
    service.name; // 'localService')
  });
});
~~~
