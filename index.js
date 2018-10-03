var express = require('express');
const fs = require('fs');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const bodyParser = require('body-parser');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
const EventEmmitter = require("events");

app.use( bodyParser.json() );
app.enable( 'trust proxy' );

class ServerEmitter extends EventEmmitter { }
const serverEmitter = new ServerEmitter();


io.on('connection', function(socket){
  console.log('a user connected');
});

app.get('/', function( req, res ) {
  res.sendFile("www/index.html", { root: __dirname });
});

var images = {};

app.get('/images/:deviceID', ( request, response ) => {
  response.writeHead(200, { 'Content-Type': 'image/jpeg' });
  response.write( images[request.params.deviceID] || '' );
  response.end();  
})

app.post('/upload/:deviceID', multipartMiddleware, async ( request, response ) => {

  await fs.readFile( request.files.filedata.path, ( error, data ) => {

    if( error ) {
      console.error( 'error uploading image', error );
      response.status( 500 ).send();
    } else {

      // if ( request.connection.remoteAddress === '::ffff:128.10.100.71' ) {
      images[request.params.deviceID] = data;

      response.send();
      serverEmitter.emit('imageRefresh', request.params.deviceID );
    }

  });
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

  serverEmitter.on("imageRefresh", deviceID => {
    console.log('telling client to load', deviceID );
    socket.emit("imageRefresh", deviceID );
  })
})
