const mongoose = require('mongoose');

const connectDB = async (uri) => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message || err);
    // In development, don't exit the process — allow the server to start
    // so routes can return controlled errors. In production, consider
    // failing fast by uncommenting the next line.
    // process.exit(1);
  }
};

module.exports = connectDB;