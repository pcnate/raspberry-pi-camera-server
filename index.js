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

      images[request.params.deviceID] = data;

      response.send();
      serverEmitter.emit('imageRefresh', { deviceID: request.params.deviceID, timestamp: 0 });
    }

  });
});

app.post('/upload/:deviceID/:timestamp', multipartMiddleware, async ( request, response ) => {

  await fs.readFile( request.files.filedata.path, ( error, data ) => {

    if( error ) {
      console.error( 'error uploading image', error );
      response.status( 500 ).send();
    } else {

      images[request.params.deviceID] = data;

      response.send();
      serverEmitter.emit('imageRefresh', { deviceID: request.params.deviceID, timestamp: request.params.timestamp });
    }

  });
});

http.listen( 3000, function() {
  console.log( 'listening on port 3000' );
})

var clientID = 0;

io.on('connection', socket => {
  let vm = {};
  vm.clientID = clientID;
  clientID++;

  console.log('a user connected ', vm.clientID );
  
  vm.tellClient = image => {
    console.log( vm.clientID, image.deviceID, image.timestamp );
    socket.emit("imageRefresh", image );
  }

  Object.keys( images ).forEach( deviceID => {
    socket.emit("imageRefresh", { deviceID, timestamp: 0 });
  })

  serverEmitter.on("imageRefresh", vm.tellClient )
  
  socket.on('disconnect', function() {
    serverEmitter.removeListener("imageRefresh", vm.tellClient )
    console.log('user disconnected');
  })

});
