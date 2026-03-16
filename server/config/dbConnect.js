const mongoose = require("mongoose");

async function connectDb() {
  await mongoose.connect(process.env.DB_URL);
}
module.exports = connectDb;
