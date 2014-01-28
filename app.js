
// ## Module dependencies

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , connect = require('connect')
  , MongoStore = require('connect-mongo')(express)
  , io = require('socket.io');


// ## Route dependencies

var Hub = require('./routes/hub')
  , auth = require('./routes/auth')
  , upload = require('./routes/upload')
  , collections = require('./routes/collections');

// ## Server Setup

var app = express()
  , server = http.createServer(app)
  , io = io.listen(server);

// ## Session Setup

var sessionStore = new MongoStore({ db: 'audio-drop' })
  , cookieParser = express.cookieParser('waytoblue')
  , SessionSockets = require('session.socket.io')
  , sockets = new SessionSockets(io, sessionStore, cookieParser);

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


// ## Routes

// - Audio wave home page
app.get('/', routes.index);
// - Partials
app.get('/partials/:name', routes.partial);

// - Join session at id
app.get('/s/:id');

// - Get admin app
app.get('/admin', auth.check, routes.admin);
// - Get login screen
app.get('/admin/login', routes.login);
// - Sign in
app.post('/auth/login', auth.login);
// - Sign out
app.get('/auth/logout', auth.logout);

// - Upload files
var type;
// Create a route for each type of upload
for(type in upload) {
  console.log('[UPLOAD]', type);
  app.post('/upload/' + type, upload[type]);
}

// ## Sockets
var admins = sockets.of('/admin');
admins.on('connection', function(err, socket, session) {
  if(err) throw err;
  
  // Sockets that connect to `/admin` must authenticate  
  if(!session.name) {
    // Log no auth
    // TODO  
    
    socket.emit('Not authenticated. Closing connection');
    delete socket;
  } else {
    // Log success
    // TODO
    
    // Pass socket to collections api
    collections(socket);
    
    // Temporary code to handle messages
    socket.on('message', function(message) {
      socket.emit('message', {
        name:'Command not recognized',
        type: 'warning'
      });      
    });
    
    // When the user disconnects, broadcast
    // the event.
    socket.on('disconnect', function() {
      socket.broadcast.emit('message', {
        name: session.name,
        body: 'has disconnected',
        type: 'info' 
      }); 
    });

    // Finally, broadcast a connection
    // message from this socket.
    socket.broadcast.emit('message', {
      name: session.name,
      body: 'has connected',
      type: 'info' 
    });

  }
});

var users = sockets.of('/users');
users.on('connection', function(err, socket, session) {
  if(err) throw err;
  console.log('Socket connected');
    
  // Pass socket straight through to Hub
  // TODO
});

