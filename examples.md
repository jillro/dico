---
layout: default
title: Examples
---

# Examples

Dico can be use to instantiate and inject services in your application. You can write your own services, or use existing ones, provided by other modules.

Using services provided by other modules can save lines of codes, as you only provide parameters which are specific to your app, skipping what is common to many applications.

For example, using the service provided by the `dico-mongodb` module, you can set up a database connection in a few lines, in a clear and esay to maintain way.

~~~ bash
$ npm install dico
$ npm install dico-mongodb
~~~

~~~ js
// app.js
var container = require('dico')('myApp');

container.load(JSON.parse('./services.json'));

container.set('userCollection', function(c, cb) {
  c.get('database', function(err, db){
    if (err) return cb(err);

    cb(null, db.collection('user'));
  });
});

container.get('@userCollection', function(err, users) {
  users.find();
});
~~~



~~~ js
// services.json
{
  "database": {
    "module": "dico-mongodb",
    "url": "mongodb://localhost:27017/test"
  }
}
~~~
