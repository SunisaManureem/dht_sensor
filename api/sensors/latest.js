// API endpoint for getting latest sensor readings
const mongoose = require('mongoose');

// MongoDB connection
const connectDB = async () => {
  if (mongoose.connections[0].readyState) {
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Sensor Data Schema (same as in data.js)
const SensorDataSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  location: {
    name: String,
    latitude: Number,
    longitude: Number
  },
  sensorData: {
    temperature: {
      type: Number,
      required: true
    },
    humidity: {
      type: Number,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    source: {
      type: String,
      default: 'ESP32'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000 // 30 days TTL
  }
}, {
  versionKey: false
});

const SensorData = mongoose.models.SensorData || mongoose.model('SensorData', SensorDataSchema);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { deviceId } = req.query;

    let query = {};
    if (deviceId) {
      query.deviceId = deviceId;
    }

    // Get the latest reading for each device
    const latestReadings = await SensorData.aggregate([
      {
        $match: query
      },
      {
        $sort: { 'sensorData.timestamp': -1 }
      },
      {
        $group: {
          _id: '$deviceId',
          latest: { $first: '$$ROOT' }
        }
      },
      {
        $project: {
          _id: 0,
          deviceId: '$latest.deviceId',
          location: '$latest.location',
          sensorData: '$latest.sensorData',
          createdAt: '$latest.createdAt'
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: latestReadings,
      count: latestReadings.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
