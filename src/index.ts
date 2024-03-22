import express, { Request, Response } from "express";
import http from "http";
import socketio from "socket.io";
import cors from "cors";
import path from "path";
import formatMessages from "./utils/messages";
import {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} from "./utils/users";
import { User } from "./entities/createUser";
import { createConnection } from "typeorm";

import { getRepository } from "typeorm";
import { ChatMessage } from "./entities/chatMessages";

const PORT: number = 9000 || process.env.PORT;

const app = express();

app.use(cors());

// This is needed in order to use socket.io
const server = http.createServer(app);
const io = new socketio.Server(server);

// Set static folder
app.use(express.static(path.join(__dirname, "../public")));

app.use(express.json());

let botName: string = "Chat-Room";

// Run when client connects
const main = async () => {
  try {
    await createConnection({
      type: "postgres",
      host: "localhost",
      port: 5432,
      username: "postgres",
      password: "brainiac238",
      database: "chatRoom",
      entities: [User, ChatMessage],
      synchronize: true,
    });
    console.log("Connected to Postgres");

    // Create a User
    app.post("/users", async (req: Request, res: Response) => {
      const { username, room } = req.body;
      const user: User = new User();
      user.username = username;
      user.room = room;
      const userRepository = getRepository(User);

      await userRepository.save(user);

      return res.json(user);
    });
    app.post("/message", async (req: Request, res: Response) => {
      const { message, username, room } = req.body;
      const messages: ChatMessage = new ChatMessage();
      messages.message = message;
      messages.username = username;
      messages.room = room;
      const userRepository = getRepository(ChatMessage);

      await userRepository.save(messages);

      return res.json(messages);
    });

    // app.get("/users", async (req: Request, res: Response) => {
    //   try {
    //     const userRepository = getRepository(User);
    //     const users = await userRepository.find();
    //     console.log(users);

    //     return res.json(users); // Send the users as JSON response
    //   } catch (error) {
    //     console.error("Error fetching users:", error);
    //     return res.status(500).json({ error: "Internal Server Error" });
    //   }
    // });

    io.on("connection", (socket: socketio.Socket) => {
      console.log("User connected...");

      socket.on(
        "joinRoom",
        ({ username, room }: { username: string; room: string }) => {
          const user = userJoin(socket.id, username, room);

          socket.join(user.room);

          // Emits a message when a user connects
          socket.emit(
            "message",
            formatMessages(botName, `${user.username} Welcome to Chat-Room`)
          );

          // Broadcast when user connects (this message will emit to everybody except the user that is connecting)
          socket.broadcast
            .to(user.room)
            .emit(
              "message",
              formatMessages(botName, `${user.username} has Entered the chat`)
            );

          // Send users and room info
          io.to(user.room).emit("roomUsers", {
            room: user.room,
            users: getRoomUsers(user.room),
          });
        }
      );

      // Listen for chatMessages from the client end
      socket.on("chatMessage", (msg: string) => {
        const user = getCurrentUser(socket.id);

        if (user) {
          io.to(user.room).emit("chats", formatMessages(user.username, msg));
        }
      });

      socket.on("disconnect", () => {
        const user = userLeave(socket.id);

        if (user) {
          io.to(user.room).emit(
            "message",
            formatMessages(botName, `${user.username} has left the chat`)
          );

          // Send users and room info
          io.to(user.room).emit("roomUsers", {
            room: user.room,
            users: getRoomUsers(user.room),
          });
        }
      });
    });

    server.listen(PORT, () => {
      console.log(
        `server is connected successfully on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(error);
    throw new Error("Unable to connect to db");
  }
};

main();
