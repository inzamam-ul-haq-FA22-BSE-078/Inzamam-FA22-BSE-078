const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors'); // ✅ CORS support added

const app = express();
app.use(cors()); // ✅ Allow requests from other devices
app.use(bodyParser.json());

// ✅ MongoDB connection string (yours is correct)
const uri = 'mongodb+srv://inzitech:inzitech@cluster0.thjlsqz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// ✅ Connect to MongoDB
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("✅ MongoDB connected successfully.");
}).catch((err) => {
  console.error("❌ MongoDB connection error:", err.message);
});

// ✅ Define schema and model
const userSchema = new mongoose.Schema({ name: String, email: String });
const User = mongoose.model('User', userSchema);

// ✅ POST route to save user data
app.post('/addData', async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.json({ message: "✅ Data saved to MongoDB" });
  } catch (err) {
    res.status(500).json({ message: "❌ Error saving data", error: err.message });
  }
});

// ✅ Listen on 0.0.0.0 so mobile devices can access it
app.listen(5000, '0.0.0.0', () => {
  console.log('🚀 Server running on http://0.0.0.0:5000');
});
