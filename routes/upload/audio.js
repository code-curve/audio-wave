var api = require('../api')
  , db = require('../collections')
  , fs = require('fs')
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
      filePath = path.resolve(__dirname + '../../../audio/' + file.name); 
      console.log('resolution', filePath);
      console.log(file.path, 'to', filePath);
     
      fs.readFile(file.path, function(err, data) {
        if(err) throw err;
        fs.writeFile(filePath, data, function(err) {
          if(err) throw err;
          file.path = filePath;
          probeFile(filePath);
        });
      });
    }
   
    // # probeFile
    // Gets the metadata from the song file
    // and saves it in the database.
    function probeFile(filePath) {
      console.log('probe', filePath);
      probe(filePath, function(err, song) {
        if(err) throw err;

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
      var model;
      console.log(song);
      model = {
        name: file.name,
        duration: song.format.duration,
        path: file.path
      };
       
      db.audio.create(model).then(function(docs) {
        console.log('created');
        console.log(docs);
      });

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
