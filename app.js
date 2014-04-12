
// ## Module dependencies

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , connect = require('connect')
  , MongoStore = require('connect-mongo')(express)
  , io = require('socket.io')
  , colors = require('colors');


// ## Route dependencies

var Hub = require('./routes/hub')
  , auth = require('./routes/auth')
  , upload = require('./routes/upload')
  , audio = require('./routes/audio')
  , collections = require('./routes/collections')
  , command = require('./routes/command');

// ## Server Setup

var app = express()
  , server = http.createServer(app)
  , io = io.listen(server);

// ## Session Setup

var sessionStore = new MongoStore({ db: 'audio-drop' }, function() {
  var cookieParser = express.cookieParser('waytoblue')
    , SessionSockets = require('session.socket.io')
    , sockets = new SessionSockets(io, sessionStore, cookieParser);

  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.logger('dev'));
  app.use(cookieParser);
  app.use(express.session({
    store: sessionStore
  }));

  app.use(app.router);
  server.listen(app.get('port'));

  app.configure('development', function() {
    app.use(express.errorHandler());
  });

  io.set('log level', 1);


  // ## Routes

  // - Audio wave home page
  app.get('/', routes.index);
  // - Partials
  app.get('/partials/:name', routes.partial);
  app.get('/partials/:component/:name', routes.partial);

  // - Join session at id
  app.get('/s', routes.user);

  // - Get admin app
  app.get('/admin', auth.check, routes.admin);
  // - Get login screen
  app.get('/admin/login', routes.login);
  // - Sign in
  app.post('/auth/login', auth.login);
  // - Sign out
  app.get('/auth/logout', auth.logout);

  // - Play audio
  app.get('/audio/play/:id', audio.play);

  // - Upload files
  var type;
  // Create a route for each type of upload
  for(type in upload) {
    console.log('[UPLOAD]', type);
    app.post('/upload/' + type, upload[type]);
  }

  var users = sockets.of('/client');
  var hub = Hub(function(socket, settings) {
    return {
      socket: socket,
      settings: settings
    }
  });

  users.on('connection', function(err, socket) {
    if(err) throw err;
    hub.connect(socket);    
  });

  // ## Sockets
  var admins = sockets.of('/admin');
  admins.on('connection', function(err, socket, session) {

    if(err) throw err;
    
    // Sockets that connect to `/admin` must authenticate  
    if(!session.name) {
      // TODO Log no auth 
      
      socket.emit('Not authenticated. Closing connection');
      delete socket;
    } else {
      // TODO Log success
      
      // Pass socket to collections api
      // which will attach methods to it
      collections(socket);
      
      // Handle all command messages
      command(session, socket);
     
      // Message 
      hub.events.on('registration', function(user) {
        socket.get('session', function(err, session) {
          if(user.settings.session === session) {
            socket.emit('client', user.settings);
          }
        });
      });
      
      // Whenever a new session is created
      hub.events.on('session', function(session) {
        console.log('Session created'.yellow, session);
        socket.emit('session', session);
      });
      
      socket.on('sessions', function() {
        console.log('REQUEST SESSIONS'.rainbow, hub.sessions);
        socket.emit('sessions', Object.keys(hub.sessions));
      });

      // Request of all clients from some sesison
      socket.on('clients', function(session) {
        socket.emit('clients', hub.sessions[session].map(_.property('settings'));
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

});
