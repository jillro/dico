'use strict';
var path = require('path');
var debug = require('debug')('didi');

var Container = function () {
  this.parameters = {};
  this.services = {};
  this.ns = 'global';
  this.LocalContainer = function(name) {
    this.ns = name;
  };
  this.LocalContainer.prototype = this;
};

/**
 * Get the value of a parameter.
 *
 * @param  {string} parameter The parameter name.
 * @return {mixed}            The value of the parameter.
 */
Container.prototype.get = function(name, cb) {
  debug('Requesting param ' + name + ' from namespace ' + this.ns);

  // check the type of the request (value or service) and remove '@' if necessary
  var valueReq;
  if ('@' === name[0]) {
    name = name.slice(1);
    valueReq = false;
  } else {
    valueReq = true;
  }

  // if local parameter exist, prepend the namespace the param name
  if ('undefined' !== typeof this.parameters[this.ns + '.' + name]) {
    name = this.ns + '.' + name;
  }

  // if value parameter requested, just return it
  if (valueReq) {
    debug('Returning param ' + name);
    return this.parameters[name];
  }

  // if service already instantiated, just cb it
  if ('undefined' !== typeof this.services[name]) {
    return cb(null, this.services[name]);
  }

  // if service does not exist cb undefined
  if ('undefined' === typeof this.parameters[name]) {
    return cb(null);
  }

  // if service not instantiated but param value is not a function,
  // assume it is a reference to another service
  if ('function' !== typeof this.parameters[name]) {
    debug('Requesting service ' + this.parameters[name]);
    return this.get(this.parameters[name], function(err, service) {
      if (err) return cb(err);

      return cb(null, service);
    });
  }

  // finally try to instantiate if it is a function
  var container = new this.LocalContainer(name);
  return this.parameters[name](container, function(err, value) {
    if (err) return cb(err);

    container.services[name] = value;

    return cb(null, value);
  });
};

/**
 * Load a config. You probably want to load this config from a json file.
 * See the readme for examples of configs.
 *
 * @param  {object} config  The config.
 * @param  {string} basedir The base directory where to look the modules.
 * @return {bool}           Returns false if error.
 */
Container.prototype.load = function(config, basedir) {
  for (var key in config) {
    // if it is a global param, we just set it
    if('undefined' === typeof config[key].module) {
      this.set(key, config[key]);
      continue;
    }

    // if it is a service (ie if it has a module field) we require it
    // and set it in the container
    var modulePath = ('.' === config[key].module[0]) ?
      path.resolve(basedir, config[key].module)
      : config[key].module;
    var module = require(modulePath);
    this.set(key, module);
    // then we set the local params
    for (var param in config[key]) {
      this.set(key + '.' + param, config[key][param]);
    }
  }
};

/**
 * Set a parameter in the container.
 *
 * @param {string} parameter The parameter name.
 * @param {mixed} value     The value of the parameter.
 */
Container.prototype.set = function(name, value) {
  this.parameters[name] = value;
};

var containers = {};

module.exports = function(name) {
  if ('undefined' === typeof name) name = 'default';
  if ('undefined' === typeof containers[name]) {
    var container = new Container();
    containers[name] = container;
  }

  return containers[name];
};
