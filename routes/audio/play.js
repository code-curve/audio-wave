var util = require('../util')
  , api = require('../api')
  , fs = require('fs')
  , mongo = require('../mongo')
  , db = mongo('audio');

module.exports = function(req, res) {
  var id;

  id = req.params.id;

  if(_.undef(id)) {
    res.setHeader('Status', 404);
    res.json(api.error({
      message: 'No id supplied'
    }))
  } else {
    find(id, res);  
  }
}

function find(id, res) {
  db.find(mongo.idify({
    _id: id
  }), function(err, docs) {
    if(err) throw err;

    if(docs.length > 0) {
      play(docs[0], res);
    } else {
      res.setHeader('Status', 404);
      res.json(api.error({
        message: 'No file found with id:' + id  
      }));
    }
  });
}

function play(audio, res) {
  var stat, readStream;

  stat = fs.statSync(audio.path);

  res.writeHead(200, {
    'Content-Type': 'audio/mpeg',
    'Content-Length': stat.size
  });
                          
  readStream = fs.createReadStream(audio.path);
  readStream.pipe(res);
}
