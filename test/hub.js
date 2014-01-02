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
    assert('connect' in hub, true);
  });

  describe('select', function() {
    var select = hub.select('session', '==', 2);
    
    it('should have 3 methods', function() {
      assert('each' in select, true);
      assert('emit' in select, true);
      assert('set' in select, true);
    });
    
    describe('results', function() {
      var results = select();
      
      it('should be an array', function() {
        assert(typeof results, 'object');
        assert(results instanceof Array);
      });
      
      it('should be an empty array', function() {
        assert(results.length === 0);
      });
    });
  
  });


  describe('all', function() {
    var all = hub.all();
    it('should be an empty array', function() {
      it('should be an array', function() {
        assert(typeof results, 'object');
        assert(results instanceof Array);
      });
      
      it('should be an empty array', function() {
        assert(results.length === 0);
      });
    });
  });

});
