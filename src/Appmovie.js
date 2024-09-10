import React, { useState, useEffect, useRef } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import Papa from 'papaparse';

const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

const countryCoordinates = {
  'USA': [-95, 40],
  'UK': [-2, 54],
  'France': [2, 46],
  'Germany': [10, 51],
  'Spain': [-3, 40],
  'Japan': [138, 38],
  'China': [105, 35],
  'Australia': [133, -25],
  'South Korea': [128, 36]
};

function CustomTooltip({ content, position }) {
  if (!content) return null;
  
  return (
    <div style={{
      position: 'absolute',
      top: `${position.y}px`,
      left: `${position.x}px`,
      backgroundColor: 'white',
      padding: '10px',
      border: '1px solid #ccc',
      borderRadius: '5px',
      pointerEvents: 'none',
      zIndex: 1000
    }}
    dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

function App() {
  const [data, setData] = useState([]);
  const [year, setYear] = useState(1916);
  const [isPlaying, setIsPlaying] = useState(true);
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const mapRef = useRef(null);

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
            Country: movie.Country in countryCoordinates ? movie.Country : 'Other'
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
        setYear(prevYear => prevYear < 2024 ? prevYear + 1 : 1916);
      }, 200);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const colorScale = scaleLinear()
    .domain([0, 10])
    .range(["#4a0e4e", "#ffd700"]);

  const sizeScale = scaleLinear()
    .domain([0, Math.max(...data.map(m => m.NumberOfRatings))])
    .range([5, 25]); // Increased the minimum size to 5

  const handleMouseEnter = (event, movie) => {
    const mapRect = mapRef.current.getBoundingClientRect();
    setTooltipContent(`
      <strong>${movie.Title} (${movie.Year})</strong><br/>
      Rating: ${movie.Rating.toFixed(1)}<br/>
      Reviews: ${movie.NumberOfRatings.toLocaleString()}<br/>
      Director: ${movie.Director}<br/>
      Country: ${movie.Country}
    `);
    setTooltipPosition({
      x: event.clientX - mapRect.left + 10,
      y: event.clientY - mapRect.top + 10
    });
  };

  const handleMouseLeave = () => {
    setTooltipContent('');
  };

  // Function to get offset coordinates for a country
  const getOffsetCoordinates = (country, index) => {
    const base = countryCoordinates[country] || [0, 0];
    const offset = 2; // Adjust this value to spread the circles more or less
    const row = Math.floor(index / 5);
    const col = index % 5;
    return [base[0] + (col - 2) * offset, base[1] + (row - 2) * offset];
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
      <div ref={mapRef} style={{ position: 'relative' }}>
        <ComposableMap>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map(geo => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#EAEAEC"
                  stroke="#D6D6DA"
                />
              ))
            }
          </Geographies>
          {data.filter(movie => movie.Year <= year).map((movie, index) => {
            const coords = getOffsetCoordinates(movie.Country, index);
            return (
              <Marker key={index} coordinates={coords}>
                <circle
                  r={sizeScale(movie.NumberOfRatings)}
                  fill={colorScale(movie.Rating)}
                  opacity={0.7}
                  onMouseEnter={(event) => handleMouseEnter(event, movie)}
                  onMouseLeave={handleMouseLeave}
                />
              </Marker>
            );
          })}
        </ComposableMap>
        <CustomTooltip content={tooltipContent} position={tooltipPosition} />
      </div>
    </div>
  );
}

export default App;