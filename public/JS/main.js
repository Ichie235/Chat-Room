const chatForm = document.getElementById("chat-form");
const formInput = document.getElementById("message");
const chatMessages = document.querySelector(".chat-messages");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");
const usernameInput = document.getElementById("username");
const roomSelect = document.getElementById("room");
const socket = io();

//GET USERNAME AND ROOM FROM URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

if (!username || !room) {
  window.location.href = "index.html";
}

function getUsernameFromURL() {
  const { username } = Qs.parse(location.search, {
      ignoreQueryPrefix: true,
  });
  return username || ''; 
}
// chatForm.addEventListener("submit", (e) => {
//   e.preventDefault();

//   // Get message text from form input
//   let msg = e.target.elements.message.value;

//   msg = msg.trim();

//   if (!msg) {
//     return false;
//   }

//   //Emit message to server
//   socket.emit("chatMessage", msg);

//   // Clear chat input

//   formInput.value = "";
//   formInput.focus();
// });

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get message text from form input
  let msg = e.target.elements.message.value.trim();
  const username = getUsernameFromURL();
  const room = getRoomFromURL();
  if (!msg) {
    return false;
  }

  try {
    const response = await fetch("/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: msg, username: username, room:room }),
    });
    if (response.ok) {
      console.log("Message sent successfully");
      // Optionally, you can emit the message to the server as before
      socket.emit("chatMessage", msg);
    } else {
      console.error("Failed to send message:", response.statusText);
      // Handle error if needed
    }
  } catch (error) {
    console.error("Error sending message:", error.message);
    // Handle error if needed
  }

  // Clear chat input
  formInput.value = "";
  formInput.focus();
});

// Join Chatroom
socket.emit("joinRoom", { username, room });

//Get room and users
socket.on("roomUsers", ({ room, users }) => {
  outPutRoomName(room);
  outPutUsers(users);
});

//Bot Messages from server
socket.on("message", (message) => {
  console.log(message);

  outputBotMessage(message);

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Chat messages from server
socket.on("chats", (chatMsg) => {
  console.log(chatMsg);

  outputChatMessage(chatMsg);

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Output message from the Chat-bot to the DOM
function outputBotMessage(message) {
  const div = document.createElement("div");
  d