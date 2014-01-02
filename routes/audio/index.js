var scan = require('./scan');
var format = require('./format');

module.exports = {
  // returns an array of all audio files
  library: function(callback) {
    scan('../audio', function(files) {
      callback(files.filter(format('mp3', 'ogg')));
    });
  },
    
  play: function(file, res) {
    
  }

  
};
