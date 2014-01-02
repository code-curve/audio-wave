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
    assert.equal('select' in hub, true);
    assert.equal('all' in hub, true);
    assert.equal('on' in hub, true);
    assert.equal('connect' in hub, true);
  });

  describe('select', function() {
    var select = hub.select('session', '==', 2);
    
    it('should have 3 methods', function() {
      assert.equal('each' in select, true);
      assert.equal('emit' in select, true);
      assert.equal('set' in select, true);
    });
    
    describe('results', function() {
      var results = select();
      
      it('should be an array', function() {
        assert.equal(typeof results, 'object');
        assert(results instanceof Array);
      });
      
      it('should be an empty array', function() {
        assert.equal(results.length, 0);
      });
    });
  
  });


  describe('all', function() {
    var all = hub.all();
    it('should be an empty array', function() {
      it('should be an array', function() {
        assert.equal(typeof results, 'object');
        assert(results instanceof Array);
      });
      
      it('should be an empty array', function() {
        assert.equal(results.length, 0);
      });
    });
  });

});
