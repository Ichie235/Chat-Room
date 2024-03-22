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

function getRoomFromURL() {
  const { room } = Qs.parse(location.search, {
      ignoreQueryPrefix: true,
  });
  return room || ''; 
}


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
  div.classList.add("chats");
  div.innerHTML = `
   <div class="mt-2">
    <p>${message.username} <span>${message.time}</span></p>
    <p class="text mt-2" style="color: red;">${message.text}</p>
    </div>
   `;
  document.querySelector(".chat-messages").appendChild(div);
}

//output chat message from users to DOM
function outputChatMessage(chatMsg) {
  const div = document.createElement("div");
  div.classList.add("chats");
  div.innerHTML = `
    <div class="card mb-2 mt-3 bg-gray-400">
    <div class="card-body">
    <p>${chatMsg.username} <span>${chatMsg.time}</span></p>
    <p class="text mt-1 text-lg" style="color: green;">${chatMsg.text}</p>
    </div>
    </div>`;
  document.querySelector(".chat-messages").appendChild(div);
}

//Add room name to DOM
function outPutRoomName(room) {
  roomName.innerText = room;
}

function outPutUsers(users) {
  userList.innerHTML = `
    ${users.map((user) => `<li>${user.username}</li>`).join("")}
   `;
}



document.getElementById("leave-btn").addEventListener("click", () => {
  const leaveRoom = confirm("Are you sure you want to leave the chatroom?");
  if (leaveRoom) {
    window.location = "../index.html";
  } else {
  }
});


