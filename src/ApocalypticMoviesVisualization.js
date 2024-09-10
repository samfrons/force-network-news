import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const ApocalypticMoviesChart = () => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const width = 1000;
    const height = 600;
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };

    const svg = d3.select(chartRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const chart = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    d3.csv("/apocalyptic_movies_details_updated.csv").then(data => {
      // Process the data
      data = data.filter(d => d.Year !== "N/A" && d.Rating !== "N/A" && d["Number of Ratings"] !== "N/A");
      data.forEach(d => {
        d.Year = +d.Year;
        d.Rating = +d.Rating;
        d.NumberOfRatings = +d["Number of Ratings"];
      });

      // Create scales
      const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.Year))
        .range([0, width - margin.left - margin.right]);

      const yScale = d3.scaleLinear()
        .domain([0, 10])
        .range([height - margin.top - margin.bottom, 0]);

      const sizeScale = d3.scaleSqrt()
        .domain(d3.extent(data, d => d.NumberOfRatings))
        .range([3, 20]);

      const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

      // Create axes
      const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
      const yAxis = d3.axisLeft(yScale);

      chart.append("g")
        .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
        .call(xAxis);

      chart.append("g")
        .call(yAxis);

      // Add axis labels
      chart.append("text")
        .attr("x", (width - margin.left - margin.right) / 2)
        .attr("y", height - margin.top - 10)
        .style("text-anchor", "middle")
        .text("Year");

      chart.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height - margin.top - margin.bottom) / 2)
        .attr("y", -40)
        .style("text-anchor", "middle")
        .text("Rating");

      // Create tooltip
      const tooltip = d3.select(chartRef.current).append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "rgba(255, 255, 255, 0.9)")
        .style("border", "1px solid #ddd")
        .style("padding", "10px")
        .style("pointer-events", "none");

      // Add circles
      chart.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.Year))
        .attr("cy", d => yScale(d.Rating))
        .attr("r", d => sizeScale(d.NumberOfRatings))
        .attr("fill", d => colorScale(d.Country))
        .attr("opacity", 0.7)
        .on("mouseover", (event, d) => {
          tooltip.transition()
            .duration(200)
            .style("opacity", .9);
          tooltip.html(`Title: ${d.Title}<br>Year: ${d.Year}<br>Rating: ${d.Rating}<br>Number of Ratings: ${d.NumberOfRatings}<br>Country: ${d.Country}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);
        });

      // Add legend
      const legend = svg.append("g")
        .attr("transform", `translate(${width - margin.right}, ${margin.top})`);

      const countries = [...new Set(data.map(d => d.Country))];
      countries.forEach((country, i) => {
        legend.append("circle")
          .attr("cx", 0)
          .attr("cy", i * 25)
          .attr("r", 7)
          .style("fill", colorScale(country));

        legend.append("text")
          .attr("x", 15)
          .attr("y", i * 25 + 5)
          .text(country)
          .style("font-size", "12px")
          .attr("alignment-baseline", "middle");
      });
    });

    // Cleanup function
    return () => {
      if (chartRef.current) {
        d3.select(chartRef.current).selectAll("*").remove();
      }
    };
  }, []);

  return (
    <div>
      <h1>Apocalyptic Movies Visualization</h1>
      <div ref={chartRef}></div>
    </div>
  );
};

export default ApocalypticMoviesChart;