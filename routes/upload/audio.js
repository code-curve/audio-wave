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
   
    // # probeFile
    // Gets the metadata from the song file
    // and saves it in the database.
    function probeFile(filePath) {
      probe(filePath, function(err, song) {
        if(err) throw err;
        console.log('[EXTENSION]', song);
        if(song.format.format_name === 'mp3') {
          saveInDb(song);
        } else {
          res.json(api.error({
            message: 'File must be mp3'
          }));
        }
      });
    }
    
    function saveInDb(song) {
      // Create a new audio item in the collection
      //db.audio.create(song);
      res.json(api.success({
        message: 'File uploaded'
      }));
    }

    // That should fire off a `collection/create`
    // event and the views should change for all
    // connected admins
  
  } else {
    
    res.json(api.error({
      message: 'Could\'t find any files'
    }));

  } 
}
