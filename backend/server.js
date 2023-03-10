const express = require("express");
require("dotenv").config({
  path:
    process.env.NODE_ENV === "production"
      ? "/etc/secrets/prod.env"
      : "./dev.env",
});
const connectDB = require("./config/db");
const userRouter = require("./routes/userRoutes");
const errorHandlers = require("./middleware/errorHandlers");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const socketIO = require("socket.io");
const path = require("path");
const colors = require("colors");
const ChatLogic = require("./logic/ChatLogic");
const fs = require("fs");
const https = require("https");

connectDB();
const app = express();
app.use(express.json({ limit: "2mb" })); // to accept json data
app.use(express.urlencoded({ limit: "2mb" }));

// If route matches api/user, use user Router
app.use("/api/user", userRouter);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

/********** Integration  Starts  *************/
const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
  );
} else {
  // empty route to ensure app is working
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}
/********** Integration  Ends  *************/

// If no match found, use notFound handler to handle error
app.use(errorHandlers.notFound);

// At last if any error, (err param in next function), use below handler
// But we are not using next(err) anywhere.
// This works because we are using the express-async-handler
// which will automatically use next(err) for us.
app.use(errorHandlers.errorHandler);

// Choose port, default is 8080
const PORT = process.env.PORT || 8080;

// For SSL setup
// const options = {
//   key: fs.readFileSync(__dirname + "/bin/server.key", "utf8"),
//   cert: fs.readFileSync(__dirname + "/bin/server.crt", "utf8"),
// };
// Start the express App
var httpsServer;

// httpsServer = https
//   .createServer(options, app)
//   .listen(
//     PORT,
//     console.log(
//       `Server started on PORT ${PORT} in ${process.env.NODE_ENV} environment`
//         .yellow.underline.bold
//     )
//   );
httpsServer = app.listen(
  PORT,
  console.log(
    `Server started on PORT ${PORT} in ${process.env.NODE_ENV} environment`
      .yellow.underline.bold
  )
);

const io = socketIO(httpsServer, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  console.log("connected to socket.io");

  socket.on("init-conn", (userData) => {
    console.log(userData._id, "joined the server");
    socket.join(userData._id);
  });

  socket.on("new-message", async (messageData) => {
    let chat = messageData.chat;
    //console.log(messageData);
    if (!chat.users) return console.log("nothing in users", chat);
    let users = await ChatLogic.fetchUsersByChat(chat._id);
    users = users.map((user) => user._id.toString());
    console.log(users);
    users.forEach((user) => {
      let socketId = user._id || user;
      if (
        socketId === messageData.sender._id ||
        socketId === messageData.sender
      )
        return;
      //console.log("sending message to ", user);
      socket.in(socketId).emit("get-message", messageData);
    });
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});
