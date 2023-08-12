var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var http=require('http')
var dotenv =require('dotenv').config();

var socketIO=require('socket.io')
var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
const {engine : hbs }=require("express-handlebars")

const dbUrl=process.env.DATABASE_URL;
const apiKey=process.env.API_KEY;
const debugMode=process.env.DEBUG === 'true';
var app = express();
var server =http.createServer(app)
var io=socketIO(server)
const fileUpload=require('express-fileupload')
var db=require('./config/connection')
var session=require('express-session')
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials/'}))
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload())

app.use(session({secret:"anime",resave:false,saveUninitialized:true,cookie:{maxAge:6000000}}))
app.use('/product-images', express.static(path.join(__dirname, 'product-images')));
db.connect((err)=>{
  if(err) console.log("connection error"+err );
 else console.log("database connected to port 27017");
  
 })
const publicChatSockets = {};
io.on('connection', (socket) => {
  console.log('New WebSocket connection');

  socket.join('publicChat');
  publicChatSockets[socket.id]=true

  // Handle public chat message
  socket.on('publicChatMessage', (message) => {
    io.to('publicChat').emit('publicChatMessage', message);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('public WebSocket connection disconnected');
    delete publicChatSockets[socket.id];
    socket.leave('publicChat');
  });

  // Handle private chat join event
  socket.on('joinPrivateChat', ({ senderId, receiverId }) => {
    const roomId = `${senderId}_${receiverId}`;
    socket.join(roomId);
  });

  // Handle private chat messages
  socket.on('prisendmessage', ({ senderId, receiverId, message }) => {
    const roomId = `${senderId}_${receiverId}`;
    io.to(roomId).emit('prirecevemessage', message);
  });

  // Handle private chat disconnection
  socket.on('disconnect', () => {
    console.log('prichat WebSocket connection disconnected');
  });
});

// Attach io object to the app object
app.io = io;

app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
// Start the server
 const port =5000;
  server.listen(port, () => {
     console.log(`Server is up and running on port ${port}`); });

module.exports = app;
