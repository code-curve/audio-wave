var api = require('../api')
  , mv = require('mv')
  , path = require('path')
  , probe = require('node-ffprobe');



module.exports = function(req, res) {
  var file;
  if(req.files) {
    file = req.files.file;
    move();

    // # move
    // Moves the temporary file to a dedicated directory
    function move() {
      var filePath;
      filePath = path.resolve(__dirname + '../../audio/'); 
      console.log('Move audio to ', filePath);

      mv(file.path, filePath, function(err) {
        if(err) throw err;
        probeFile(filePath);
      });
    }
    
    function probeFile(filePath) {
      probe(filePath, function(song) {
        saveInDb(song);
      });
    }
    
    function saveInDb(song) {
      // Create a new audio item in the collection
      //db.audio.create(song);
    }

    // That should fire off a `collection/create`
    // event and the views should change for all
    // connected admins
  
    res.json(api.success({
      message: 'File uploaded'
    }));

  } else {
    
    res.json(api.error({
      message: 'No files present'
    }));

  } 
}
