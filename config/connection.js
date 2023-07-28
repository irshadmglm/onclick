const { MongoClient } = require('mongodb');

const state = {
  db: null,
};

// Function to establish MongoDB connection
const connect = async (cb) => {
  try {
    let url;

    if (process.env.NODE_ENV === 'production') {
      // For Railway deployment, use the environment variable provided by Railway
      url = process.env.MONGODB_URI;
    } else {
      // For local development, use the local MongoDB URL
      const localUrl = 'mongodb://127.0.0.1:27017';
      const dbName = 'onclick';
      url =` ${localUrl}/${dbName}`;
    }

    // Connect to MongoDB
    const client = new MongoClient(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Connecting to MongoDB
    await client.connect();

    // Setting up the database name to the connected client
    const db = client.db();

    // Setting up the database name to the state
    state.db = db;

    // Callback after connecting
    return cb();
  } catch (err) {
    // Callback when an error occurs
    return cb(err);
  }
};

// Function to get the database instance
const get = () => state.db;

// Exporting functions
module.exports = {
  connect,
  get,
};
