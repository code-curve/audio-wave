
/**
 * Module dependencies
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , connect = require('connect')
  , MongoStore = require('connect-mongo')(express)
  , io = require('socket.io');

/**
 * Route dependencies
 */

var Hub = require('./routes/hub')
  , auth = require('./routes/auth')
  , collections = require('./routes/collections');

/**
 * Server setup
 */

var app = express()
  , server = http.createServer(app)
  , io = io.listen(server);

/**
 * Session setup
 */

var sessionStore = new MongoStore({ db: 'audio-drop' })
  , cookieParser = express.cookieParser('waytoblue')
  , SessionSockets = require('session.socket.io')
  , sessionSockets = new SessionSockets(io, sessionStore, cookieParser);

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser);
app.use(express.session({
  store: sessionStore
}));
app.use(app.router);
server.listen(app.get('port'));

app.configure('development', function() {
  app.use(express.errorHandler());
});


/**
 * Routes
 */
console.log('Create Routes');

// audio wave home page
app.get('/', routes.index);
//partials
app.get('/partials/:name', routes.partial);

// join session at id
app.get('/s/:id');

// get admin app
app.get('/admin', auth.check, routes.admin);
// get login screen
app.get('/admin/login', routes.login);
// sign in
app.post('/auth/login', auth.login);
// sign out
app.get('/auth/logout', auth.logout);

/**
 * Sockets
 */
console.log('Create Sockets');

// single entry for socket connections
sessionSockets.of('/admin').on('connection', function(err, socket, session) {
  if(err) throw err;
  // sockets that connect to /admin must authenticate

  console.log('Socket connection to /admin');

  if(!session.name) {
    socket.emit('Not authenticated. Closing connection');
    delete socket;
  } else {
    // pass to collection apis
    collections(socket);     
  }
});

sessionSockets.of('/users').on('connection', function(err, socket, session) {
  if(err) throw err;
  console.log('Socket connected');
});

