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

var cam1, cam2, cam3, cam4;

app.get('/cam1.jpg', ( request, response ) => {
  console.log('cam1' );
  response.writeHead(200, { 'Content-Type': 'image/jpeg' });
  response.write( cam1 || '' );
  response.end();  
})

app.get('/cam2.jpg', ( request, response ) => {
  console.log('cam2' );
  response.writeHead(200, { 'Content-Type': 'image/jpeg' });
  response.write( cam2 || '' );
  response.end();  
})

app.get('/cam3.jpg', ( request, response ) => {
  console.log('cam3' );
  response.writeHead(200, { 'Content-Type': 'image/jpeg' });
  response.write( cam3 || '' );
  response.end();  
})

app.get('/cam4.jpg', ( request, response ) => {
  console.log('cam4' );
  response.writeHead(200, { 'Content-Type': 'image/jpeg' });
  response.write( cam4 || '' );
  response.end();  
})

app.post('/upload', multipartMiddleware, async ( request, response ) => {
  console.log('upload', request.query, request.connection.remoteAddress );
  await fs.readFile( request.files.filedata.path, ( error, data ) => {

    if( error ) {
      console.error( 'error uploading image', error );
      response.status( 500 ).send();
    } else {

      // if ( request.connection.remoteAddress === '::ffff:128.10.100.71' ) {
      cam1 = data;
      cam2 = data;
      cam3 = data;
      cam4 = data;
      response.send();
      serverEmitter.emit('imageRefresh');
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

  serverEmitter.on("imageRefresh", function () {
    console.log('telling client to load new image');
    socket.emit("imageRefresh");
  })
})
