module.exports = function() {
  return {
    restrict: 'A',
    templateUrl: '/partials/visualisation',
    compile: function(scope, element, attrs) { 
      
    },
    controller: function($scope, $element) {
      var canvas, context, balls;
      canvas = $element[0].children[0];
      context = canvas.getContext('2d');

      canvas.width = document.body.clientWidth;
      canvas.height = document.body.clientHeight;
      
      balls = [];
 
      function createBall() {
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 300,
          i: Math.random() * 5 - 2.5,
          j: Math.random() * 5 - 2.5,
          s: Math.random() * 70 + 30
        }
      }

      function update() {
        setTimeout(update, 20);
        context.fillStyle = '#222';
        context.fillRect(0, 0, canvas.width, canvas.height);

        if(Math.random() > 0.95) {
          balls.push(createBall());
        }

        balls.map(function(ball) {
          context.beginPath();
          ball.x += ball.i;
          ball.y += ball.j;
          context.arc(ball.x, ball.y, ball.r ,0, 2 * Math.PI);
          context.fillStyle = 'hsla(120, ' + ball.s  + '%, 70%, 0.3)';
          context.fill();
          return ball;
        });
      }

      balls.push(createBall());
      balls.push(createBall());
      balls.push(createBall());
      update();
    }
  };
};

  
