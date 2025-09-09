<<<<<<< HEAD
<<<<<<< HEAD
# Weather App with ESP32 DHT11 Sensor Integration

A modern weather application that combines OpenWeatherMap data with real-time ESP32 DHT11 sensor readings, deployed on Vercel with MongoDB Atlas.

## 🌟 Features

- **Real-time Weather Data**: OpenWeatherMap API integration
- **ESP32 Sensor Integration**: Live DHT11 temperature and humidity readings
- **Interactive Charts**: Historical sensor data visualization
- **iOS-style UI**: Beautiful gradient backgrounds with light/dark themes
- **Auto-refresh**: Sensor data updates every 2 minutes
- **Responsive Design**: Works on desktop and mobile devices

## 🏗️ Architecture

```
ESP32 (DHT11) → Vercel API → MongoDB Atlas → Web Interface
     ↑                                              ↑
     └── HTTP POST every 60 seconds ─────────────────┘
```

## 🔧 Setup Instructions

### 1. MongoDB Atlas Setup

1. Create a free MongoDB Atlas account at [mongodb.com](https://mongodb.com)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Get your connection string (replace `<password>` with your actual password)
5. Whitelist your IP address or use `0.0.0.0/0` for all IPs

### 2. ESP32 Hardware Setup

**Components needed:**
- ESP32 development board
- DHT11 temperature/humidity sensor
- Jumper wires
- Breadboard (optional)

**Wiring:**
```
DHT11    ESP32
VCC   →  3.3V
GND   →  GND
DATA  →  GPIO 2
```

### 3. Arduino Code Setup

1. Install Arduino IDE
2. Install required libraries:
   - WiFi (built-in)
   - HTTPClient (built-in)
   - ArduinoJson (`Tools > Manage Libraries > Search "ArduinoJson"`)
   - DHT sensor library (`Tools > Manage Libraries > Search "DHT sensor library"`)
3. Flash the provided Arduino code to your ESP32
4. Update WiFi credentials in the code:
   ```cpp
   const char* ssid = "Your_WiFi_Name";
   const char* password = "Your_WiFi_Password";
   ```
5. Update the server URL after Vercel deployment:
   ```cpp
   const char* serverURL = "https://your-app.vercel.app/api";
   ```

### 4. Vercel Deployment

1. **Fork/Clone this repository**
2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Choose "Other" framework
3. **Set Environment Variables:**
   ```
   MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/weather_db?retryWrites=true&w=majority
   API_KEY=your_openweathermap_api_key_here
   ```
4. **Deploy the project**

### 5. Get OpenWeatherMap API Key

1. Sign up at [openweathermap.org](https://openweathermap.org)
2. Get your free API key from the dashboard
3. Add it to your Vercel environment variables

## 📡 API Endpoints

### ESP32 Sensor Data

**POST** `/api/sensors/data`
```json
{
  "deviceId": "ESP32-DHT22-001",
  "location": {
    "name": "ESP32 Sensor",
    "latitude": 0.0,
    "longitude": 0.0
  },
  "sensorData": {
    "temperature": 26.5,
    "humidity": 65.0,
    "source": "ESP32"
  }
}
```

**GET** `/api/sensors/latest`
- Returns latest sensor readings

**GET** `/api/sensors/data?hours=24&limit=100`
- Returns historical sensor data
- Parameters: `hours`, `limit`, `deviceId`, `startDate`, `endDate`

**GET** `/api/sensors/history?hours=24&interval=hour`
- Returns aggregated historical data
- Parameters: `hours`, `interval` (minute/hour/day), `deviceId`

## 🛠️ Local Development

### Backend (Node.js)
```bash
cd backend
npm install
npm start
# Default port: 5000
```

### Frontend (Static)
```bash
cd frontend
npm install
npm start
# Default port: 4000
```

### Environment Variables (.env)
```env
MONGO_URL=mongodb://localhost:27017/weather_db
API_KEY=your_openweathermap_api_key
PORT=5000
```

## 🎨 UI Features

- **Automatic Theme**: Switches between light and dark based on time
- **Manual Theme**: Light/Dark/Auto modes
- **City Selection**: Bangkok, Chiang Mai, Phuket, Khon Kaen
- **Real-time Clock**: Always shows current time
- **Sensor Status**: Online/Offline indicator with last update time
- **Interactive Charts**: 6h/12h/24h historical data views

## 📊 Data Storage

### Weather Data Schema
```javascript
{
  timestamp: Date,
  temperature: Number,
  windspeed: Number,
  winddirection: Number,
  weathercode: Number,
  raw: Object
}
```

### Sensor Data Schema
```javascript
{
  deviceId: String,
  location: {
    name: String,
    latitude: Number,
    longitude: Number
  },
  sensorData: {
    temperature: Number,
    humidity: Number,
    timestamp: Date,
    source: String
  },
  createdAt: Date (TTL: 30 days)
}
```

## 🔍 Monitoring

- **Sensor Status**: Real-time online/offline detection
- **Auto-refresh**: Data updates every 2 minutes
- **Error Handling**: Graceful fallbacks for offline sensors
- **Data Retention**: 30-day automatic cleanup

## 🚀 Production Deployment

1. **Vercel**: Frontend and API
2. **MongoDB Atlas**: Database
3. **ESP32**: Sensor device

## 📝 Troubleshooting

### ESP32 Not Sending Data
- Check WiFi connection
- Verify server URL in Arduino code
- Check serial monitor for error messages
- Ensure MongoDB connection string is correct

### Sensor Shows Offline
- Check if ESP32 is powered on
- Verify network connectivity
- Check Vercel function logs
- Ensure API endpoints are accessible

### Charts Not Loading
- Check browser console for errors
- Verify API responses in Network tab
- Ensure Chart.js is loaded properly

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Credits

- **Weather Data**: OpenWeatherMap API
- **Icons**: Native Emojis
- **Charts**: Chart.js
- **Database**: MongoDB Atlas
- **Deployment**: Vercel

<!-- Updated: 2025-09-10 - Force deployment sync -->
=======
# ผู้จัดทำ
นางสาวสุนิสา มนูรีม 66030292

นายอาดิ๊ล บินสอั๊ด 66030301
>>>>>>> 01cf3e4ff3a5bbddc821c30c9c78771da88b0381
=======
<<<<<<< HEAD
# Weather App with ESP32 DHT11 Sensor Integration

A modern weather application that combines OpenWeatherMap data with real-time ESP32 DHT11 sensor readings, deployed on Vercel with MongoDB Atlas.

## 🌟 Features

- **Real-time Weather Data**: OpenWeatherMap API integration
- **ESP32 Sensor Integration**: Live DHT11 temperature and humidity readings
- **Interactive Charts**: Historical sensor data visualization
- **iOS-style UI**: Beautiful gradient backgrounds with light/dark themes
- **Auto-refresh**: Sensor data updates every 2 minutes
- **Responsive Design**: Works on desktop and mobile devices

## 🏗️ Architecture

```
ESP32 (DHT11) → Vercel API → MongoDB Atlas → Web Interface
     ↑                                              ↑
     └── HTTP POST every 60 seconds ─────────────────┘
```



## 🙏 Credits

- **Weather Data**: OpenWeatherMap API
- **Icons**: Native Emojis
- **Charts**: Chart.js
- **Database**: MongoDB Atlas
- **Deployment**: Vercel
=======
# ผู้จัดทำ
นางสาวสุนิสา มนูรีม 66030292

นายอาดิ๊ล บินสอั๊ด 66030301
>>>>>>> 01cf3e4ff3a5bbddc821c30c9c78771da88b0381
>>>>>>> 03fb4e58b9251ffd009c6d12ced09d5022716ab1
