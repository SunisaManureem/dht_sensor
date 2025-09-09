#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include <DHT.h>

// WiFi credentials - UPDATE THESE WITH YOUR WIFI DETAILS
const char* ssid = "Adil";         // ⬅️ Your WiFi network name
const char* password = "0622198015";  // ⬅️ Your WiFi password

// Server configuration for Vercel deployment - UPDATE THIS AFTER DEPLOYMENT
const char* serverURL = "https://web-weather-two.vercel.app/api"; // ✅ Your Vercel URL
const unsigned long uploadInterval = 60000; // Upload every 60 seconds

// NTP configuration
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 7 * 3600;     // GMT+7 (Thailand timezone)
const int daylightOffset_sec = 0;        // Thailand doesn't use daylight saving time

// DHT11 Temperature and Humidity sensor configuration
#define DHT_PIN 2          // DHT11 sensor connected to GPIO 2
#define DHT_TYPE DHT11     // DHT11 sensor type

// Initialize DHT sensor
DHT dht(DHT_PIN, DHT_TYPE);

// Timing variables
unsigned long lastUpload = 0;

void setup() {
  Serial.begin(115200);
  Serial.println("=== ESP32 Weather Sensor Starting ===");
  
  // Initialize DHT11 sensor
  dht.begin();
  Serial.println("DHT11 Temperature and Humidity sensor initialized");
  Serial.printf("DHT11 sensor connected to GPIO %d\n", DHT_PIN);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  Serial.print("Server URL: ");
  Serial.println(serverURL);
  
  // Initialize and get the time
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("Time synchronization started...");
  
  // Wait for time to be set (up to 10 seconds)
  int retries = 0;
  struct tm timeinfo;
  while (!getLocalTime(&timeinfo) && retries < 20) {
    delay(500);
    retries++;
    Serial.print(".");
  }
  
  if (retries >= 20) {
    Serial.println("\nFailed to obtain time - will use relative timestamps");
  } else {
    Serial.println("\nTime synchronized successfully!");
    Serial.print("Thailand time (GMT+7): ");
    Serial.println(&timeinfo, "%A, %B %d %Y %H:%M:%S");
    
    // Print the actual Unix timestamp for debugging
    time_t now;
    time(&now);
    Serial.printf("Unix timestamp: %lu\n", now);
  }
  
  Serial.println("=== Setup Complete - Starting sensor readings ===");
}

void loop() {
  unsigned long currentTime = millis();
  
  // Check if it's time to read and upload data
  if (currentTime - lastUpload >= uploadInterval) {
    readAndUploadSensorData();
    lastUpload = currentTime;
  }
  
  // Small delay to prevent watchdog issues
  delay(1000);
}

void readAndUploadSensorData() {
  Serial.println("\n=== Reading DHT11 Sensor Data ===");
  
  // Read temperature and humidity from DHT sensor
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  
  // Check if any reads failed and exit early (to try again)
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("❌ Failed to read from DHT11 sensor!");
    Serial.println("   Check sensor connections:");
    Serial.println("   - VCC to 3.3V");
    Serial.println("   - GND to GND"); 
    Serial.println("   - DATA to GPIO 2");
    return;
  }
  
  // Display readings clearly
  Serial.println("--- DHT11 SENSOR VALUES ---");
  Serial.printf("🌡️  Temperature: %.1f°C\n", temperature);  // DHT11 has 1°C resolution
  Serial.printf("💧 Humidity: %.0f%%\n", humidity);         // DHT11 has 1% resolution
  Serial.println("---------------------------");
  
  // Send data to server
  if (WiFi.status() == WL_CONNECTED) {
    sendDataToServer(temperature, humidity);
  } else {
    Serial.println("ERROR: WiFi not connected!");
    Serial.println("Attempting to reconnect...");
    // Try to reconnect
    WiFi.reconnect();
    delay(5000); // Wait 5 seconds before next attempt
  }
}

void sendDataToServer(float temperature, float humidity) {
  HTTPClient http;
  
  // Create the full URL for the sensor data endpoint
  String url = String(serverURL) + "/sensors/data";
  Serial.println("Connecting to: " + url);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000); // 10 second timeout
  
  // Create JSON payload - matching the API endpoint format
  StaticJsonDocument<300> doc;
  doc["deviceId"] = "ESP32-DHT11-001";
  doc["location"]["name"] = "ESP32 Sensor Location";
  doc["location"]["latitude"] = 0.0;  // Set your actual coordinates
  doc["location"]["longitude"] = 0.0;
  doc["sensorData"]["temperature"] = temperature;
  doc["sensorData"]["humidity"] = humidity;
  doc["sensorData"]["source"] = "ESP32";
  // Let the server set the timestamp to ensure accuracy
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("Sending JSON data:");
  Serial.println(jsonString);
  
  // Send POST request
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("✅ Server response code: %d\n", httpResponseCode);
    Serial.println("Server response: " + response);
    
    if (httpResponseCode == 200) {
      Serial.println("✅ Data uploaded successfully!");
    } else if (httpResponseCode == 400) {
      Serial.println("⚠️  Bad request - check JSON format");
    } else if (httpResponseCode == 500) {
      Serial.println("⚠️  Server error - database may be unavailable");
    }
  } else {
    Serial.printf("❌ Error sending data. HTTP Error Code: %d\n", httpResponseCode);
    printWiFiStatus();
    
    // Try to diagnose the error
    if (httpResponseCode == -1) {
      Serial.println("   → Connection timeout - check internet connection");
    } else if (httpResponseCode == -11) {
      Serial.println("   → Connection refused - check server URL");
    }
  }
  
  http.end();
}

void printWiFiStatus() {
  Serial.print("WiFi Status: ");
  switch(WiFi.status()) {
    case WL_CONNECTED:
      Serial.println("Connected");
      Serial.print("Signal strength (RSSI): ");
      Serial.print(WiFi.RSSI());
      Serial.println(" dBm");
      break;
    case WL_NO_SSID_AVAIL:
      Serial.println("SSID not available");
      break;
    case WL_CONNECT_FAILED:
      Serial.println("Connection failed");
      break;
    case WL_CONNECTION_LOST:
      Serial.println("Connection lost");
      break;
    case WL_DISCONNECTED:
      Serial.println("Disconnected");
      break;
    default:
      Serial.println("Unknown status");
      break;
  }
}
