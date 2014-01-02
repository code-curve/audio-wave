module.exports = {
  // home page
  index: function(req, res){
    res.render('index');
  },
  
  // partials
  partial: function(req, res) {
    var name = req.params.name;
    res.render('partials/' + name);
  }
};

