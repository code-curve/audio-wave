
/**
 * Module dependencies.
 */

var admin = require('./routes/admin')
  , audio = require('./routes/audio');

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function() {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(cookieParser());
  app.use(express.session({secret: 'audioallovertheworld'}));
});

app.configure('development', function() {
  app.use(express.errorHandler());
});

// audio wave home page
app.get('/', routes.index);

// join session at id
app.get('/s/:id');

// get admin app
app.get('/admin', admin.auth, admin.index);
// authenticate admin
app.get('/admin/login', admin.login);

// http api
app.get('/admin/api/create', admin.auth, admin.api.create);
app.get('/admin/api/delete', admin.auth, admin.api.delete);

http.createServer(app).listen(app.get('port'), function() {
  console.log("Express server listening on port " + app.get('port'));
});
