const mongoose = require('mongoose');

async function connectDb() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connecté');
}

const chats = {};

module.exports = { connectDb, chats };
