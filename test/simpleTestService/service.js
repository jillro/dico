'use strict';

module.exports = function(c, cb) {
  var service = {};
  service.param1 = c.get('param1');
  service.param2 = c.get('param2');

  return cb(null, service);
};
