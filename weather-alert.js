// Import required libraries
const axios = require('axios');
const nodemailer = require('nodemailer');

// Get environment variables (we'll store these securely later)
const ACCUWEATHER_API_KEY = process.env.ACCUWEATHER_API_KEY;
const LOCATION_KEY = process.env.LOCATION_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
const EMAIL_TO = process.env.EMAIL_TO;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

// Function to fetch weather forecast from AccuWeather
async function getWeatherForecast() {
  try {
    const url = `http://dataservice.accuweather.com/forecasts/v1/daily/5day/${LOCATION_KEY}?apikey=${ACCUWEATHER_API_KEY}&details=true`;
    const response = await axios.get(url);
    return response.data.DailyForecasts;
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    throw error;
  }
}

// Function to analyze forecast for garden-relevant conditions
function analyzeGardenConditions(forecast) {
  const alerts = [];
  
  forecast.forEach((day, index) => {
    const date = new Date(day.Date);
    const formattedDate = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const conditions = day.Day.IconPhrase;
    const tempHigh = day.Temperature.Maximum.Value;
    const tempLow = day.Temperature.Minimum.Value;
    const rainProb = day.Day.RainProbability;
    
    // Check for frost risk (below 36°F / 2°C)
    if (tempLow <= 36) {
      alerts.push(`🥶 FROST ALERT for ${formattedDate}: Overnight low of ${tempLow}°F - Cover sensitive plants!`);
    }
    
    // Check for heat stress (above 90°F / 32°C)
    if (tempHigh >= 90) {
      alerts.push(`🔥 HEAT ALERT for ${formattedDate}: High of ${tempHigh}°F - Water plants thoroughly in morning/evening!`);
    }
    
    // Check for heavy rain
    if (rainProb >= 70) {
      alerts.push(`💧 RAIN ALERT for ${formattedDate}: ${rainProb}% chance of precipitation - Hold off on fertilizing!`);
    }
    
    // Drought warning (3+ consecutive days with <30% rain chance)
    if (index <= 2 && rainProb < 30) {
      if (index === 0 || (index > 0 && forecast[index-1].Day.RainProbability < 30)) {
        alerts.push(`🏜️ DRY SPELL for ${formattedDate}: Low rain chance continues - Deep water your garden!`);
      }
    }
  });
  
  return alerts;
}

// Function to send email with alerts
async function sendAlertEmail(alerts) {
  // If no alerts, no need to send email
  if (alerts.length === 0) {
    console.log('No garden alerts for today!');
    return;
  }
  
  // Configure email transporter (for Gmail)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_FROM,
      pass: EMAIL_PASSWORD
    }
  });
  
  // Build email content
  const emailContent = `
    <h2>🌱 Garden Weather Alert 🌱</h2>
    <p>Here are today's important alerts for your garden:</p>
    <ul>
      ${alerts.map(alert => `<li>${alert}</li>`).join('')}
    </ul>
    <p>Happy Gardening!</p>
  `;
  
  // Send email
  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      subject: `Garden Alert: ${alerts.length} Weather Condition${alerts.length > 1 ? 's' : ''} to Watch`,
      html: emailContent
    });
    console.log('Garden alerts email sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// Main function to run the entire process
async function runWeatherAlerts() {
  try {
    console.log('Fetching weather forecast...');
    const forecast = await getWeatherForecast();
    
    console.log('Analyzing garden conditions...');
    const alerts = analyzeGardenConditions(forecast);
    
    console.log('Sending alerts...');
    await sendAlertEmail(alerts);
    
    console.log('Weather alert process completed successfully!');
  } catch (error) {
    console.error('Error in weather alert process:', error);
    process.exit(1);
  }
}

// Run the program
runWeatherAlerts();
```
