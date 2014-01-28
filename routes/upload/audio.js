var api = require('../api');

module.exports = function(req, res) {
  if(req.files) {
    console.log(req.files);
  }
  res.json(api.success({
    message: 'File uploaded'
  }));
}
