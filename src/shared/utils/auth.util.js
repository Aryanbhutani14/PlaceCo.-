const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'placeco_academic_secret_jwt_key_2026';
const JWT_EXPIRES_IN = '24h';

function hashPassword(plainTextPassword) {
  return bcrypt.hashSync(plainTextPassword, 10);
}

function comparePassword(plainTextPassword, hashedPassword) {
  return bcrypt.compareSync(plainTextPassword, hashedPassword);
}

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  JWT_SECRET
};
