var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

io.on('connection', function(socket){
  console.log('a user connected');
});

app.get('/', function( req, res ) {
  res.sendFile("www/index.html", { root: __dirname });
});

http.listen( 3000, function() {
  console.log( 'listening on port 3000' );
})

io.on('connection', function( socket ) {
  console.log('connection');
  socket.emit('test');

  socket.on('disconnect', function() {
    console.log('user disconnected');
  })
})
