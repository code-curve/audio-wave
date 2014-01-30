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
    var name, component;
    name = req.params.name;
    console.log('RENDER partials/' + name);
    component = req.params.component;
    if(!component) {
      res.render('partials/' + name);
    } else {
      res.render('partials/' + component + '/' + name);
    }
  }
};

