import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Weather.css';

const Weather = () => {
  const navigate = useNavigate();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=Fukuoka&appid=9ed77731a5cf84ec51d1465fe92918c8`
        );

        setWeatherData(response.data);
        setLoading(false);
      } catch (error) {
        setError(error);
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  if (loading) return <div>Loading...</div>;
  
  if (error) return <div>Error: {error.message}</div>;

  const handleClick = () => {
    navigate('/home');
  };

  const kelvinToCelsius = (kelvin) => {
    return (kelvin - 273.15).toFixed(2);
  };

  return (
    <div className="weather-page-wrapper">
      <button 
        className="weather-button" 
        onClick={handleClick} 
        style={{ cursor: 'pointer', border: 'none', background: 'none', outline: 'none' }}>
        <img src="Home.jpg" alt="Go to Home" style={{ width: '250px', height: '120px' }} />
      </button>
      <div className="weather-page">
        <div className="weather-container">
          <h2 className="weather-title">Weather in {weatherData.name}</h2>
          <div className="weather-info">
            <p className="weather-temp">Temperature: {kelvinToCelsius(weatherData.main.temp)} °C</p>
            <p className="weather-desc">Description: {weatherData.weather[0].description}</p>
          </div>
          <img
            className="weather-icon"
            src={`http://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png`}
            alt="Weather Icon"
          />
        </div>
      </div>
    </div>
  );
};

export default Weather;