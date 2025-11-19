const mongoose = require("mongoose");


const connectDB = async () => {
  const MONGO_URI = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}/${process.env.MONGODB_DB}`;
  try {
    await mongoose.connect(MONGO_URI, {
      
    });
    console.log("✅ MongoDB connected successfully!");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1); // Exit if DB connection fails
  }
};

module.exports = connectDB;
