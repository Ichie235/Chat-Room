interface User {
    id?: number;
    socketId:string
    username: string;
    room: string;
}

const users: User[] = [];

// Join user to chat
function userJoin(socketId: string, username: string, room: string): User {
    const user: User = {  username, room,socketId };
    users.push(user);
    return user;
}

// Get current user
function getCurrentUser(id: string): User | undefined {
    return users.find(user => user.socketId === id);
}

// User leaves chat
function userLeave(id: string): User | undefined {
    const index = users.findIndex(user => user.socketId === id);
    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
}

// Get room users
function getRoomUsers(room: string): User[] {
    return users.filter(user => user.room === room);
}

export { userJoin, getCurrentUser, userLeave, getRoomUsers };
