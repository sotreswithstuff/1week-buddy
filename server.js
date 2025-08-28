// server.js
// Run: npm init -y
//       npm install express socket.io
//       node server.js
// Then open http://localhost:3000

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

// In-memory store (demo). Not for production.
const state = {
  messages: [], // { id, userId, name, avatar, text, imgData, time, replies: [{...}], reactions: {emoji: Set([...userId])} }
};

function uid(prefix='id', len=6){
  return prefix + '_' + [...Array(len)].map(()=>Math.random().toString(36)[2]).join('');
}

function now(){ return new Date().toISOString(); }

io.on('connection', (socket) => {
  // handshake: client sends profile after connection optionally
  socket.on('join', (profile) => {
    socket.profile = profile || { id: uid('u',6), name:'Anonymous', avatar:null };
    // send current history (optional)
    socket.emit('init', { messages: state.messages });
  });

  socket.on('sendMessage', (payload) => {
    // payload: { userId, name, avatar, text, imgData, replyTo }
    const msg = {
      id: uid('m',7),
      userId: payload.userId,
      name: payload.name || 'Anonymous',
      avatar: payload.avatar || null,
      text: payload.text || '',
      imgData: payload.imgData || null,
      time: now(),
      replies: [],
      reactions: {} // emoji -> Set stored as array later
    };
    // if replyTo, add reply inline and still push message as usual (keeps linear flow)
    if(payload.replyTo){
      // find parent and push a reply object
      const parent = state.messages.find(m => m.id === payload.replyTo);
      if(parent){
        const replyObj = { id: uid('r',6), userId: msg.userId, name: msg.name, text: msg.text, time: msg.time };
        parent.replies.push(replyObj);
        // don't duplicate by not pushing msg.text into top-level? We'll still push the message as normal but keep parent's reply for threaded display
      }
    }
    state.messages.push(msg);
    // Broadcast full new message to everyone
    io.emit('message:new', msg);
  });

  socket.on('react', ({ messageId, emoji, userId }) => {
    const msg = state.messages.find(m => m.id === messageId);
    if(!msg) return;
    if(!msg.reactions[emoji]) msg.reactions[emoji] = [];
    const set = new Set(msg.reactions[emoji]);
    if(set.has(userId)) set.delete(userId); else set.add(userId);
    msg.reactions[emoji] = Array.from(set);
    io.emit('message:update', { id: msg.id, reactions: msg.reactions });
  });

  socket.on('reply', ({ messageId, userId, name, text }) => {
    const msg = state.messages.find(m => m.id === messageId);
    if(!msg) return;
    const r = { id: uid('r',6), userId, name, text, time: now() };
    msg.replies.push(r);
    io.emit('message:update', { id: msg.id, replies: msg.replies });
  });

  socket.on('clearAll', () => {
    state.messages = [];
    io.emit('messages:cleared');
  });

  socket.on('disconnect', ()=>{});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=> console.log('Listening on', PORT));
