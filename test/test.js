'use strict';

var dico = require('../lib/index.js')('test');
var assert = require('assert');
var path = require('path');

describe('Dico', function() {
  describe('#set and #get', function() {
    // we set a param and get back its value
    it('should work for a single param', function(done) {
      dico.set('paramName', 'paramValue');
      assert.equal(dico.get('paramName'), 'paramValue');

      return done();
    });

    // we set a service and use get to instantiate it
    it('should work for a single service', function(done) {
      dico.set('serviceName', function serviceName(container, cb) {
        var myService = { name: 'fooService' };

        return cb(null, myService);
      });

      dico.get('@serviceName', function(err, value) {
        var service = value;
        assert.deepEqual({ name: 'fooService' }, service);

        return done();
      });
    });
  });

  describe('#get', function() {
    it('should give undefined if value parameter is unset', function(done) {
      assert.equal(typeof dico.get('unkownParam'), 'undefined');

      return done();
    });

    it('should give undefined if service is unset', function(done) {
      dico.get('@unkownService', function(err, service) {
        if (err) return done(err);

        assert.equal(typeof service, 'undefined');

        return done();
      });
    });

    it('should fallback to give the value when a value param is prefixed ' +
    'with @ but is not a function', function(done) {
      dico.set('valueParam', 'paramValue');
      dico.get('@valueParam', function(err, service) {
        if (err) return done(err);

        assert.equal(service, 'paramValue');

        return done();
      });
    });

    it('should not reinstantiate services twice', function(done) {
      var i = 0;

      dico.set('serviceChanging', function serviceBig(container, cb) {
        var myService = { n : i };
        i++;
        return cb(null, myService);
      });

      var ok = 0;

      dico.get('@serviceChanging', function(err, service) {
        assert.equal(service.n, 0);
        ok++;
        if (2 === ok) done();
      });

      dico.get('@serviceChanging', function(err, service) {
        assert.equal(service.n, 0);
        ok++;
        if (2 === ok) done();
      });
    });
  });

  describe('#set', function() {
    it('should not affect global ns in service creation function', function(done) {
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
        assert.equal(typeof dico.get('localParam'), 'undefined');
        assert.equal(dico.get('globalService.localParam'), 'localParamValue');
        dico.get('@localService', function(err, service) {
          assert.equal(typeof service, 'undefined');

          dico.get('@globalService.localService', function(err, service) {
            assert.equal(service.name, 'localService');
            done();
          });
        });
      });
    });
  });

  describe('#load', function() {
    it('should load simple services from config file', function(done) {
      // in real use case, we would probably require config from a json file
      dico.load({
        'simpleTestService': {
          'module': './simpleTestService/service.js',
          'param1': '1',
          'param2': '2'
        }
      }, __dirname);

      dico.get('@simpleTestService', function(err, testService) {
        if(err) return done(err);

        assert.equal(testService.param1, 1);
        assert.equal(testService.param2, 2);

        return done();
      });
    });

    it('should load interdependent services from config file', function(done) {
      dico.load({
        'dependentTestService': {
          'module': './dependentTestService/service.js',
          'dependencyService': '@simpleTestService'
        }
      }, __dirname);

      dico.get('@dependentTestService', function(err, service){
        assert.equal(service.dependencyService.param1, 1);

        return done();
      });
    });

    it('should inject global params when not setted localy', function(done) {
      dico.load({
        'simpleTestServiceUsingGlobalParams': {
          'module': './simpleTestService/service.js',
        },
        'param1': 'globalValue'
      }, __dirname);

      dico.get('@simpleTestServiceUsingGlobalParams', function(err, service) {
        if (err) return done(err);

        assert.equal(service.param1, 'globalValue');

        return done();
      });
    });

    it('should inject global params only when not setted localy', function(done) {
      dico.load({
        'simpleTestServiceUsingLocalParams': {
          'module': './simpleTestService/service.js',
          'param1': 'localValue'
        },
        'param1': 'globalValue'
      }, __dirname);

      dico.get('@simpleTestServiceUsingLocalParams', function(err, service) {
        if (err) return done(err);

        assert.equal(service.param1, 'localValue');

        return done();
      });
    });

    it('and #get should instantiate local reinjected services once', function(done) {
      dico.load({
        'dependentTestServiceUsingLocallyAlreadyInstantiatedDependency': {
          'module': './dependentTestService/service.js',
          'dependencyService': '@serviceChanging'
        }
      }, __dirname);

      dico.get('@dependentTestServiceUsingLocallyAlreadyInstantiatedDependency',
          function(err, service) {
            if(err) return done(err);

            assert.equal(service.dependencyService.n, 0);

            done();
          });
    });
  });

  describe('module', function() {
    it('should give new container if called with different parameter', function(done){
      var container = require('../lib/index.js')('test2');
      assert.equal(typeof container.get('paramName'), 'undefined');

      return done();
    });
  });
});
