"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = __importDefault(require("socket.io"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
require("reflect-metadata");
const messages_1 = __importDefault(require("./utils/messages"));
const users_1 = require("./utils/users");
const createUser_1 = require("./entities/createUser");
const typeorm_1 = require("typeorm");
const chatMessages_1 = require("./entities/chatMessages");
const dotenv_1 = __importDefault(require("dotenv"));
const PORT = 9000 || process.env.PORT;
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
dotenv_1.default.config();
// This is needed in order to use socket.io
const server = http_1.default.createServer(app);
const io = new socket_io_1.default.Server(server);
// Set static folder
app.use(express_1.default.static(path_1.default.join(__dirname, "../public")));
app.use(express_1.default.json());
let botName = "Chat-Room";
const AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [createUser_1.User, chatMessages_1.ChatMessage],
    synchronize: true,
    logging: false,
});
// Run when client connects
const main = async () => {
    AppDataSource.initialize()
        .then(() => {
        console.log("Connected to Postgres");
        // Create a User
        app.post("/users", async (req, res) => {
            const { username, room } = req.body;
            const user = new createUser_1.User();
            user.username = username;
            user.room = room;
            await AppDataSource.manager.save(user);
            return res.json(user);
        });
        app.post("/message", async (req, res) => {
            const { message, username, room } = req.body;
            const messages = new chatMessages_1.ChatMessage();
            const user = new createUser_1.User();
            messages.message = message;
            messages.username = username;
            messages.room = room;
            messages.user = user;
            await AppDataSource.manager.save(messages);
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
        io.on("connection", (socket) => {
            console.log("User connected...");
            socket.on("joinRoom", ({ username, room }) => {
                const user = (0, users_1.userJoin)(socket.id, username, room);
                socket.join(user.room);
                // Emits a message when a user connects
                socket.emit("message", (0, messages_1.default)(botName, `${user.username} Welcome to Chat-Room`));
                // Broadcast when user connects (this message will emit to everybody except the user that is connecting)
                socket.broadcast
                    .to(user.room)
                    .emit("message", (0, messages_1.default)(botName, `${user.username} has Entered the chat`));
                // Send users and room info
                io.to(user.room).emit("roomUsers", {
                    room: user.room,
                    users: (0, users_1.getRoomUsers)(user.room),
                });
            });
            // Listen for chatMessages from the client end
            socket.on("chatMessage", (msg) => {
                const user = (0, users_1.getCurrentUser)(socket.id);
                if (user) {
                    io.to(user.room).emit("chats", (0, messages_1.default)(user.username, msg));
                }
            });
            socket.on("disconnect", () => {
                const user = (0, users_1.userLeave)(socket.id);
                if (user) {
                    io.to(user.room).emit("message", (0, messages_1.default)(botName, `${user.username} has left the chat`));
                    // Send users and room info
                    io.to(user.room).emit("roomUsers", {
                        room: user.room,
                        users: (0, users_1.getRoomUsers)(user.room),
                    });
                }
            });
        });
        server.listen(PORT, () => {
            console.log(`server is connected successfully on http://localhost:${PORT}`);
        });
    })
        .catch((error) => console.log(error));
};
main();
