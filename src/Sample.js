import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';

const WorldMap = () => {
  const mapRef = useRef();

  useEffect(() => {
    const fetchWorldData = async () => {
      const response = await fetch('https://unpkg.com/world-atlas@2.0.2/countries-50m.json');
      const data = await response.json();
      const countries = feature(data, data.objects.countries);
      drawMap(countries);
    };

    fetchWorldData();
  }, []);

  const drawMap = (countries) => {
    const width = 800;
    const height = 450;

    const svg = d3.select(mapRef.current)
      .attr('width', width)
      .attr('height', height);

    const projection = d3.geoMercator()
      .fitSize([width, height], countries);

    const path = d3.geoPath().projection(projection);

    svg.selectAll('path')
      .data(countries.features)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('fill', '#ccc')
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5);
  };

  return <svg ref={mapRef}></svg>;
};

export default WorldMap;