var distances = [];

var locate = function(devices, done) {
  // get the users ready
  devices.emit('wakeup');
  
  // when they are ready, start
  devices.when('ready', function() {
    if(devices.length > 0) {
      listen(devices, done);
    }
  });
};

var listen = function(devices, done, to) {
  
  if(!to) to = 0;
  // prepare this row of distance table
  distances[to] = [];
  
  // set every device to be listening
  devices.each(function(device, index) {
    // apart from the one pinging
    if(to !== index) {
      device.emit('listen');
      // when they hear it log the time
      device.on('heard', function(time) {
        // watch out that this doesn't 
        // get overwritten
        distances[to][index] = time;
      });
    }
  });
  
  devices.when('ready', function() {
    devices[to].emit('ping');  
  });

  // when all devices have heard
  // start a new ping or callback
  devices.when('heard', function() {
    if(to < users.length) {
      listen(users, done, to);
    } else {
      done(distances);
    }
  });
  
};

module.exports = locate;
