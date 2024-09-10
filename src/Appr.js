import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

const countryColors = {
  'United States': '#FF6B6B',
  'United Kingdom': '#4ECDC4',
  'France': '#45B7D1',
  'Germany': '#FFA07A',
  'Spain': '#98D8C8',
  'Japan': '#F06292',
  'China': '#AED581',
  'Australia': '#FFD54F',
  'South Korea': '#7986CB',
  'Other': '#B0BEC5'
};

function App() {
  const [data, setData] = useState([]);
  const [year, setYear] = useState(1916);
  const [maxYear, setMaxYear] = useState(2024);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    Papa.parse('/apocalyptic_movies_details_updated.csv', {
      download: true,
      header: true,
      complete: (results) => {
        const parsedData = results.data
          .filter(movie => movie.Year && movie.Rating && movie['Number of Ratings'] && movie.Country)
          .map(movie => ({
            Title: movie.Title,
            Year: parseInt(movie.Year),
            Rating: parseFloat(movie.Rating),
            Director: movie.Director,
            NumberOfRatings: parseInt(movie['Number of Ratings']) || 0,
            Country: movie.Country in countryColors ? movie.Country : 'Other'
          }))
          .filter(movie => movie.Year >= 1916 && movie.Year <= 2024);
        setData(parsedData);
      }
    });
  }, []);

  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setYear(prevYear => prevYear < maxYear ? prevYear + 1 : 1916);
      }, 200);
    }
    return () => clearInterval(timer);
  }, [isPlaying, maxYear]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const movie = payload[0].payload;
      return (
        <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
          <p style={{ fontWeight: 'bold' }}>{movie.Title}</p>
          <p>Year: {movie.Year}</p>
          <p>Rating: {movie.Rating.toFixed(1)}</p>
          <p>Number of Ratings: {movie.NumberOfRatings.toLocaleString()}</p>
          <p>Director: {movie.Director}</p>
          <p>Country: {movie.Country}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="App" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>Apocalyptic Movies: Rating Over Time and Origin</h1>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ marginRight: '20px' }}>Year: {year}</h2>
        <button onClick={() => setIsPlaying(!isPlaying)} style={{ fontSize: '16px', padding: '5px 10px' }}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <input
          type="range"
          min={1916}
          max={2024}
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          style={{ marginLeft: '20px', width: '300px' }}
        />
      </div>
      <div style={{ width: '100%', height: '600px' }}>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid />
            <XAxis type="number" dataKey="Year" name="Year" domain={[1916, 2024]} />
            <YAxis type="number" dataKey="Rating" name="Rating" domain={[0, 10]} />
            <ZAxis type="number" dataKey="NumberOfRatings" range={[20, 1000]} name="Number of Ratings" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {Object.keys(countryColors).map(country => (
              <Scatter
                key={country}
                name={country}
                data={data.filter(movie => movie.Year <= year && movie.Country === country)}
                fill={countryColors[country]}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default App;