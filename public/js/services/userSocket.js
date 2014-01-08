
/**
 * userSocket factory
 *
 * Provides a socket connected to 
 * the user channel.
 */

module.exports = function(socket) {
  return socket('user');
};
