const mongoose = require("mongoose");

const connectToDatabse = async () => {
  await mongoose
    .connect(
      `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@playlistforrunners.mzstijr.mongodb.net/?retryWrites=true&w=majority`
    )
    .then(() => {
      return console.log("Conectado ao Mongo");
    });
};

module.exports = connectToDatabse;
