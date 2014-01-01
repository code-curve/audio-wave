var assert = require('assert');
var Hub = require('../routes/hub');


describe('Hub', function() { 
  var hub = Hub(function(socket, settings) {
    return {
      socket: socket,
      session: settings.session
    }
  });

  it('should have 4 methods', function() {
    assert('select' in hub, true);
    assert('all' in hub, true);
    assert('on' in hub, true);
    assert('connectt ' in hub, true);
  });

});
