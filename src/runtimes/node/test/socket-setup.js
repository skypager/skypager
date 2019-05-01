module.exports = function(socket) {
  socket.subscribe('/hi', person => {
    console.log(`hi ${person}`)
    socket.publish(`/hi/${person}`, 'hi back')
  })
}
