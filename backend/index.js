const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const enrollmentRoutes = require("./routes/enrollment");
const courseRoutes = require("./routes/course");
const lessonRoutes = require("./routes/lesson");
const authRoutes = require("./routes/auth");
const progressRoutes = require("./routes/progress");
const { seedDatabase } = require("./seed");

const app = express();

app.use(express.json());
app.use(cors());
const port = process.env.PORT || 8000;
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/learnhub";

// Test Route
app.get("/", (req, res) => {
  res.send("LearnHub Backend Running");
});

// Auth Routes
app.use("/", authRoutes);
app.use("/", enrollmentRoutes);
app.use("/", courseRoutes);
app.use("/", lessonRoutes);
app.use("/", progressRoutes);


mongoose.connect(mongoUri)
  .then(async () => {
    console.log("MongoDB Connected");
    await seedDatabase();
    app.listen(port, () => console.log(`Server Started on Port ${port}`));
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exitCode = 1;
  });