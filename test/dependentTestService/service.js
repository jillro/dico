'use strict';

module.exports = function(c, cb) {
  c.get('@dependencyService', function(err, dependencyService) {
    if (err) return cb(err);

    var service = {
      dependencyService: dependencyService
    };

    return cb(null, service);
  });
};
