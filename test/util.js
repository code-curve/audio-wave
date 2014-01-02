var assert = require('assert');
var _ = require('../routes/util');


describe('Util', function() { 
  
  describe('type', function() {
    var cat = 'cat';
    var dog = 406;
    var fish = ['g', 0, 'l', 4];
    var insect = { legs: 100 };
    assert(_.type(cat, 'string'));
    assert(_.type(dog, 'number'));
    assert(_.type(fish, 'object'));
    assert(_.type(insect, 'object'));
  });

  describe('undef', function() {
    var cat = 'cat';
    var dog = 406;
    var fish = ['g', 0, 'l', 4];
    var insect = { legs: 100 };
    var frog, kitten, cow, beetle;
   
    assert.equal(_.undef(cat), false);
    assert.equal(_.undef(kitten), true);
    assert.equal(_.undef(frog, cow, beetle), true);
    assert.equal(_.undef(frog, cow, cat), false);
  });

});
