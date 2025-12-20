const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Simple in-memory store for development only. Not persistent.
const users = new Map();

async function createUser({ name, email, password, isAdmin }) {
  if (users.has(email)) {
    const err = new Error('Email exists');
    err.code = 'EMAIL_EXISTS';
    throw err;
  }
  const hashed = await bcrypt.hash(password, 10);
  const id = crypto.randomBytes(12).toString('hex');
  const user = { id, name, email, password: hashed, isAdmin: !!isAdmin, createdAt: new Date() };
  users.set(email, user);
  return user;
}

async function findUserByEmail(email) {
  return users.get(email) || null;
}

module.exports = { createUser, findUserByEmail };
