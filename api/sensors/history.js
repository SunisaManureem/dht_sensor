// API endpoint for getting historical sensor data with aggregation
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

    const { 
      deviceId, 
      hours = 24,
      interval = 'hour', // 'minute', 'hour', 'day'
      startDate,
      endDate 
    } = req.query;

    let query = {};
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
      const hoursAgo = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);
      dateFilter = { $gte: hoursAgo };
    }
    
    query['sensorData.timestamp'] = dateFilter;

    // Define aggregation interval
    let dateFormat;
    let groupInterval;
    
    switch (interval) {
      case 'minute':
        dateFormat = '%Y-%m-%d %H:%M';
        groupInterval = {
          year: { $year: '$sensorData.timestamp' },
          month: { $month: '$sensorData.timestamp' },
          day: { $dayOfMonth: '$sensorData.timestamp' },
          hour: { $hour: '$sensorData.timestamp' },
          minute: { $minute: '$sensorData.timestamp' }
        };
        break;
      case 'day':
        dateFormat = '%Y-%m-%d';
        groupInterval = {
          year: { $year: '$sensorData.timestamp' },
          month: { $month: '$sensorData.timestamp' },
          day: { $dayOfMonth: '$sensorData.timestamp' }
        };
        break;
      default: // hour
        dateFormat = '%Y-%m-%d %H:00';
        groupInterval = {
          year: { $year: '$sensorData.timestamp' },
          month: { $month: '$sensorData.timestamp' },
          day: { $dayOfMonth: '$sensorData.timestamp' },
          hour: { $hour: '$sensorData.timestamp' }
        };
    }

    // Aggregation pipeline for historical data
    const aggregatedData = await SensorData.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: {
            deviceId: '$deviceId',
            interval: groupInterval
          },
          avgTemperature: { $avg: '$sensorData.temperature' },
          minTemperature: { $min: '$sensorData.temperature' },
          maxTemperature: { $max: '$sensorData.temperature' },
          avgHumidity: { $avg: '$sensorData.humidity' },
          minHumidity: { $min: '$sensorData.humidity' },
          maxHumidity: { $max: '$sensorData.humidity' },
          count: { $sum: 1 },
          firstReading: { $min: '$sensorData.timestamp' },
          lastReading: { $max: '$sensorData.timestamp' },
          location: { $first: '$location' }
        }
      },
      {
        $sort: { 'firstReading': 1 }
      },
      {
        $project: {
          _id: 0,
          deviceId: '$_id.deviceId',
          timestamp: '$firstReading',
          interval: '$_id.interval',
          temperature: {
            avg: { $round: ['$avgTemperature', 2] },
            min: { $round: ['$minTemperature', 2] },
            max: { $round: ['$maxTemperature', 2] }
          },
          humidity: {
            avg: { $round: ['$avgHumidity', 1] },
            min: { $round: ['$minHumidity', 1] },
            max: { $round: ['$maxHumidity', 1] }
          },
          count: 1,
          timeRange: {
            start: '$firstReading',
            end: '$lastReading'
          },
          location: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: aggregatedData,
      count: aggregatedData.length,
      query: {
        deviceId,
        hours: parseInt(hours),
        interval,
        dateRange: dateFilter
      },
      meta: {
        aggregationInterval: interval,
        totalDataPoints: aggregatedData.length,
        timespan: {
          start: dateFilter.$gte,
          end: dateFilter.$lte || new Date()
        }
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
