module.exports = {
  // home page
  index: function(req, res){
    res.render('index');
  },
  
  // admin page
  admin: function(req, res) {
    res.render('admin');
  },

  login: function(req, res) {
    res.render('login');
  },
  
  // partials
  partial: function(req, res) {
    var name = req.params.name;
    res.render('partials/' + name);
  }
};

