const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let users = {};

// CHAT HISTORY STORAGE
const roomMessages = {};

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  // JOIN ROOM
  socket.on("join-room", (data) => {
    socket.join(data.room);

    users[socket.id] = {
      name: data.name,
      room: data.room,
    };

    const roomUsers = Object.values(users).filter(
      (user) => user.room === data.room
    );

    // SEND OLD CHAT HISTORY
    if (!roomMessages[data.room]) {
      roomMessages[data.room] = [];
    }

    socket.emit(
      "chat-history",
      roomMessages[data.room]
    );

    io.to(data.room).emit(
      "users-count",
      roomUsers.length
    );

    io.to(data.room).emit(
      "notification",
      `${data.name} joined room 🎉`
    );

    console.log(
      `${data.name} joined ${data.room}`
    );
  });

  // REALTIME EDITOR SYNC
  socket.on("send-changes", (data) => {
    socket.to(data.room).emit(
      "receive-changes",
      data.text
    );
  });

  // CHAT MESSAGE + SAVE HISTORY
  socket.on("send-message", (data) => {
    if (!roomMessages[data.room]) {
      roomMessages[data.room] = [];
    }

    roomMessages[data.room].push(data);

    io.to(data.room).emit(
      "receive-message",
      data
    );
  });

  // TYPING INDICATOR
  socket.on("typing", (data) => {
    socket.to(data.room).emit(
      "typing",
      `${data.name} is typing... ✍️`
    );
  });

  socket.on("stop-typing", (room) => {
    socket.to(room).emit(
      "typing",
      ""
    );
  });

  // USER DISCONNECT
  socket.on("disconnect", () => {
    if (users[socket.id]) {
      const room = users[socket.id].room;
      const name = users[socket.id].name;

      delete users[socket.id];

      const roomUsers = Object.values(users).filter(
        (user) => user.room === room
      );

      io.to(room).emit(
        "users-count",
        roomUsers.length
      );

      io.to(room).emit(
        "notification",
        `${name} left room 👋`
      );

      console.log(
        `${name} disconnected`
      );
    }
  });
});

server.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});