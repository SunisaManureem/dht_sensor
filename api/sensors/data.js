// API endpoint for receiving ESP32 sensor data
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
    console.log('MongoDB connected for sensor data');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Sensor Data Schema
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

// Create indexes for better query performance
SensorDataSchema.index({ 'sensorData.timestamp': -1 });
SensorDataSchema.index({ deviceId: 1, 'sensorData.timestamp': -1 });

const SensorData = mongoose.models.SensorData || mongoose.model('SensorData', SensorDataSchema);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await connectDB();

    if (req.method === 'POST') {
      // Receive sensor data from ESP32
      const { deviceId, location, sensorData } = req.body;

      // Validate required fields
      if (!deviceId || !sensorData || typeof sensorData.temperature !== 'number' || typeof sensorData.humidity !== 'number') {
        return res.status(400).json({
          error: 'Missing required fields: deviceId, sensorData.temperature, sensorData.humidity'
        });
      }

      // Create new sensor data entry
      const newSensorData = new SensorData({
        deviceId,
        location: location || { name: 'Unknown Location', latitude: 0, longitude: 0 },
        sensorData: {
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          timestamp: new Date(),
          source: sensorData.source || 'ESP32'
        }
      });

      await newSensorData.save();

      console.log(`[SENSOR] Data received from ${deviceId}: ${sensorData.temperature}°C, ${sensorData.humidity}%`);

      res.status(200).json({
        success: true,
        message: 'Sensor data saved successfully',
        data: {
          id: newSensorData._id,
          deviceId: newSensorData.deviceId,
          temperature: newSensorData.sensorData.temperature,
          humidity: newSensorData.sensorData.humidity,
          timestamp: newSensorData.sensorData.timestamp
        }
      });

    } else if (req.method === 'GET') {
      // Get sensor data with query parameters
      const { 
        deviceId, 
        limit = 100, 
        hours = 24,
        startDate,
        endDate 
      } = req.query;

      let query = {};
      
      // Filter by device ID if provided
      if (deviceId) {
        query.deviceId = deviceId;
      }

      // Date range filtering
      let dateFilter = {};
      if (startDate && endDate) {
        dateFilter = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      } else {
        // Default to last N hours
        const hoursAgo = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);
        dateFilter = { $gte: hoursAgo };
      }
      
      query['sensorData.timestamp'] = dateFilter;

      const sensorData = await SensorData
        .find(query)
        .sort({ 'sensorData.timestamp': -1 })
        .limit(parseInt(limit))
        .lean();

      // Get latest reading for each device
      const latestReadings = await SensorData.aggregate([
        {
          $match: {
            'sensorData.timestamp': { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        },
        {
          $sort: { 'sensorData.timestamp': -1 }
        },
        {
          $group: {
            _id: '$deviceId',
            latest: { $first: '$$ROOT' }
          }
        }
      ]);

      res.status(200).json({
        success: true,
        data: sensorData,
        latestReadings: latestReadings.map(item => item.latest),
        count: sensorData.length,
        query: {
          deviceId,
          limit: parseInt(limit),
          hours: parseInt(hours),
          dateRange: dateFilter
        }
      });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
