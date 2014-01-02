var fs = require('fs');

module.exports = function scan(directory, done, results) {
  
  if(!results) results = [];
  
  fs.readdir(directory, function(err, files) {
    if(err) return done(err);

    var pending = files.length;
    if(!pending) return done(null, results);
    
    files.forEach(function(file) {
      file = directory + '/' + file;
      
      fs.stat(file, function(err, stat) {
        if(stat && stat.isDirectory()) {
          // recurse
          walk(file, done, results);
        } else {
          results.push({
            name: file.match(/\/(\w+\.w+)$/i)[1],
            path: file
          );
          // finish
          if(!--pending) done(null, results);
        }
      });
    });

  }
};
