module.exports = function($scope, $http) {
  // user credentials
  $scope.username = '';
  $scope.password = '';
  
  // error object (name, message)
  $scope.error = null;

  $scope.validate = function() {
    if($scope.username.length < 3 || $scope.username.length > 12) {
      $scope.error = {
        name: 'This username is too long',
        message: 'Username should be between 3 and 12 characters long.'
      };
      return false;
    }
    if($scope.password.length > 24) {
      $scope.error = {
        name: 'This password is too long',
        message: 'Passwords should be less than 25 characters long.'
      };
      return false;
    }
    if(!($scope.password && $scope.username)) {
      $scope.error = {
        name: 'What are you doing?',
        message: 'You must supply a username and password'
      };
      return false;
    }
    return true;
  };

  $scope.change = function() {
    $scope.error = null;
  };

  // method to call for authentication
  $scope.login = function() {
    
    if($scope.validate()) {
      
      $http.post('/auth/login', {
        name: $scope.username,
        password: $scope.password
      }).

      success(function(res, status) {
        if(status === 200) {
          if(res.data.auth) {
            window.location = '/admin';
          } else {
            $scope.error = res.data.error;
          }
        } else {
          $scope.error = {
            name: 'Server error',
            message: 'There was a problem with the server.'
          }
        }
      }).

      error(function(data, status) {
        $scope.error = {
          name: 'Server error',
          message: 'Oh dear, something went very wrong.'
        };
      });

    };
    
  }
  
};
