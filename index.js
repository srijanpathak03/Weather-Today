import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
// import requestIp from "request-ip"; // Import the request-ip middleware

const app = express();
app.use(express.static('public'));


const port = 3000;
const apiKey = "cd5fdb59d71ab8e21465b73339521377";
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(requestIp.mw()); // Use requestIp middleware to get the user's IP address

//this function take the usepa index and return a message based on the index
function getAirQualityMessage(index) {
  switch (index) {
    case 1:
      return "Very Good";
    case 2:
      return "Good";
    case 3:
      return "Moderate";
    case 4:
      return "Unhealthy";
    case 5:
      return "Very Unhealthy";
    case 6:
      return "Hazardous";
    default:
      return "Unknown";
  }
}


app.get('/', async (req, res) => {
  try {
    const apiUrl = 'https://weatherapi-com.p.rapidapi.com/forecast.json';
    const ip = req.clientIp;

    // Make an Axios request and wait for the response
    const response = await axios.get(apiUrl, {
      params: {
        q: 'London',
        days: '3',
        aqi: 'yes', // Include this parameter to request aqi
      },
      headers: {
        'X-RapidAPI-Key': '15dff35342msh87901028a87d8b3p18309djsnafd8a82a2741',
        'X-RapidAPI-Host': 'weatherapi-com.p.rapidapi.com',
      },
    });

    const currentTime = new Date().getHours();
    const hourlyData = response.data.forecast.forecastday[0].hour;
    //this willpass the us epa index nt the function i created above and return a string msg
    const airQualityMessage = getAirQualityMessage(response.data.current.air_quality['us-epa-index']);

    // Check if there are enough hours left in the day for a 6-hour forecast
    if (hourlyData.length - currentTime >= 6) {
      // Display next 6 hours for today
      const nextSixHoursData = hourlyData.slice(currentTime, currentTime + 6);
      res.render("index.ejs", { content: response.data, nextSixHoursData: nextSixHoursData ,airQualityMessage:airQualityMessage });
    } else {
      // Not enough hours left for today, display remaining hours for today and the first few hours of tomorrow
      const nextSixHoursDataToday = hourlyData.slice(currentTime); // Remaining hours for today
      const tomorrowHourlyData = response.data.forecast.forecastday[1].hour;
      const nextSixHoursDataTomorrow = tomorrowHourlyData.slice(0, 6 - nextSixHoursDataToday.length); // Hours from tomorrow to complete 6 hours
      const combinedData = [...nextSixHoursDataToday, ...nextSixHoursDataTomorrow];
      res.render("index.ejs", { content: response.data, nextSixHoursData: combinedData ,airQualityMessage:airQualityMessage });
    }

    // console.log(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});


app.post('/search', async (req, res) => {
  const searchQuery = req.body.query;

  const apiUrl = 'https://weatherapi-com.p.rapidapi.com/forecast.json';

  try {
    const response = await axios.get(apiUrl, { 
    params:{
      q: searchQuery,
      days: '3',
      aqi:'yes',
    }, 
    headers:{
      'X-RapidAPI-Key': '15dff35342msh87901028a87d8b3p18309djsnafd8a82a2741',
      'X-RapidAPI-Host': 'weatherapi-com.p.rapidapi.com'
    } 
  });
    const currentTime = new Date().getHours();
    const hourlyData = response.data.forecast.forecastday[0].hour;
    const airQualityMessage = getAirQualityMessage(response.data.current.air_quality['us-epa-index']);
    // console.log(airQualityMessage);
    // Check if there are enough hours left in the day for a 6-hour forecast
    if (hourlyData.length - currentTime >= 6) {
      // Display next 6 hours for today
      const nextSixHoursData = hourlyData.slice(currentTime, currentTime + 6);
      res.render("index.ejs", { content: response.data, nextSixHoursData: nextSixHoursData, airQualityMessage:airQualityMessage  });
    } else {
      // Not enough hours left for today, display remaining hours for today and the first few hours of tomorrow
      const nextSixHoursDataToday = hourlyData.slice(currentTime); // Remaining hours for today
      const tomorrowHourlyData = response.data.forecast.forecastday[1].hour;
      const nextSixHoursDataTomorrow = tomorrowHourlyData.slice(0, 6 - nextSixHoursDataToday.length); // Hours from tomorrow to complete 6 hours
      const combinedData = [...nextSixHoursDataToday, ...nextSixHoursDataTomorrow];
      res.render("index.ejs", { content: response.data, nextSixHoursData: combinedData,airQualityMessage: airQualityMessage  });
    }
    console.log(response.data);
    console.log(response.data.aqi);
  } catch (error) {
    console.error(error);
    res.render("error.ejs", { errorMessage: "Location not found" });
    // res.status(500).json({ error: 'An error occurred' });
    
  }
});

  
app.listen(port, () => {
    console.log(`Server Running on port ${port}`);
});
