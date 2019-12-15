const mongoose = require("mongoose");
const crypto = require('crypto');

const DataSchema = new mongoose.Schema(
  {
    id: Number,
    message: String
  },
  { timestamps: true }
);

const UsersSchema = new mongoose.Schema(
  {
    id: Number,
    name: String,
    role: String,
    password: String
  }
);

UsersSchema.methods.isAdmin = function() {
  return this.role === 'admin';
}

UsersSchema.methods.isPasswordValid = function(p) {
  const hash = crypto.createHash('sha256').update(''+p).digest('base64');
  return this.password === hash;
}

UsersSchema.methods.makeSession = function(u) {
  return crypto.createHash('sha256').update('' + new Date() + u).digest('base64');
}

module.exports = mongoose.model("Data", DataSchema);
module.exports = mongoose.model("User", UsersSchema);
