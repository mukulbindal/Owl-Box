const express = require("express");
require("dotenv").config();
const chats = require("./data/data");
const connectDB = require("./config/db");
const colors = require("colors");
const userRouter = require("./routes/userRoutes");
const errorHandlers = require("./middleware/errorHandlers");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const socketIO = require("socket.io");
connectDB();
const app = express();
app.use(express.json({ limit: "2mb" })); // to accept json data
app.use(express.urlencoded({ limit: "2mb" }));
// empty route to ensure app is working
app.get("/", (req, res) => {
  res.send("Page is working");
});

// If route matches api/user, use user Router
app.use("/api/user", userRouter);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
// If no match found, use notFound handler to handle error
app.use(errorHandlers.notFound);

// At last if any error, (err param in next function), use below handler
// But we are not using next(err) anywhere.
// This works because we are using the express-async-handler
// which will automatically use next(err) for us.
app.use(errorHandlers.errorHandler);

// Choose port, default is 8080
const PORT = process.env.PORT || 8080;

// Start the express App
const server = app.listen(
  PORT,
  console.log(`Server started on PORT ${PORT}`.yellow.underline.bold)
);

const io = socketIO(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  console.log("connected to socket.io");

  socket.on("init-conn", (userData) => {
    console.log(userData._id);
    socket.join(userData._id);
  });

  socket.on("new-message", (messageData) => {
    let chat = messageData.chat;
    //console.log(messageData);
    if (!chat.users) return console.log("nothing in users", chat);

    chat.users.forEach((user) => {
      if (user === messageData.sender._id) return;
      //console.log("sending message to ", user);
      socket.in(user).emit("get-message", messageData);
    });
  });
});
