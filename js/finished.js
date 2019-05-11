'use strict';

(function () {

  let data = "no data";
  let allYearsData = "no data";
  let svgBarPlot = "";

  // load data and make scatter plot after window loads
  window.onload = function () {
    svgBarPlot = d3.select('body')
      .append('svg')
      .attr('width', 750)
      .attr('height', 550);

    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("./data/Seasons (SimpsonsData).csv")
      .then((csvData) => {
        data = csvData
        makeBarPlot(data);
      });
  }

  // make scatter plot with trend line
  function makeBarPlot(allData) {

    // get arrays of fertility rate data and life Expectancy data
    let avg_viewer_data = data.map((row) => parseFloat(row["Avg. Viewers (mil)"]));
    let year_data = data.map((row) => parseFloat(row["Year"]));
    // find data limits
    let axesLimits = findMinMax(year_data, avg_viewer_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits);

    // plot data as points and add tooltip functionality
    plotData(mapFunctions);

    // draw avergae of all average viewer data
    let avg_avg_viewer = mean(avg_viewer_data);
    drawLine(avg_avg_viewer, axesLimits);

    // draw title and axes labels
    makeLabels();
  }

  // input a array of numbers and output the mean of the numbers
  function mean(column) {
    let sum = 0;
    for (let i = 0; i < column.length; i++) {
      sum += column[i];
    }
    let avg = sum / column.length;

    return avg;
  }

  // draw line for given yValue
  function drawLine(yValue, limits) {

    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5])
      .range([50, 450]);
    svgBarPlot.append("g")
      .attr("transform", "translate(50, " + yScale(yValue) + ")")
      .append("line")
      .attr("x2", 670)
      .style("stroke", "#2ecc71")
      .style("stroke-width", "5px")
    svgBarPlot.append("text")
      .text(d3.format("0.2f")(yValue))
      .attr("x", 690)
      .attr("y", yScale(yValue) - 14)
      .attr("dy", "0.75em");
  }

  // make title and axes labels
  function makeLabels() {
    svgBarPlot.append('text')
      .attr('x', 50)
      .attr('y', 30)
      .style('font-size', '14pt')
      .text("Average Viewership By Season");

    svgBarPlot.append('text')
      .attr('x', 300)
      .attr('y', 500)
      .style('font-size', '10pt')
      .text('Season Years');

    svgBarPlot.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Avg. Viewers (in millions)');
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map) {
    let color = d3.scaleOrdinal()
      .range(["#a05d56", "#4633FF"])

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    // make tooltip
    let div = d3.select("body").append("div")
      .attr("class", "toolTip")
      .style("opacity", 0);

    // append data to SVG and plot as points
    svgBarPlot.selectAll('.dot')
      .data(data)
      .enter()
      .append('rect')
      .attr("width", 650 / data.length - 1)
      .attr("height", function (d) {
        return 450 - map.yScale(+d["Avg. Viewers (mil)"]);
      })
      .attr("x", function (d, i) {
        return ((675 / data.length) * i + 50);
      })
      .attr("y", function (d) {
        return map.yScale(+d["Avg. Viewers (mil)"]);
      })
      .attr("fill", d => color(d.Data))
      // add tooltip functionality to points
      .on("mouseover", (d) => {
        div.transition()
          .duration(200)
          .style("opacity", .9);
        div.html("<div class='tooltip-heading'> Season #" + d.Year + "</div>" +
          "<div class='row'> <div class='column left'>" +
          "<p> Year: </p> " +
          "<p> Episodes: </p>" +
          "<p>  Avg Viewers (mil): </p> <br/>" +
          "<p>  Most Watched Episode: </p>" +
          "<p>  Viewers (mil): </p> </div >" +
          "<div class='column right'> <p>" + d.Year + "</p>" +
          "<p>" + d.Episodes + "</p> <p>" + d["Avg. Viewers (mil)"] +
          "</p> <br/> <p>" + d["Most watched episode"] + "</p> <p>" +
          d["Viewers (mil)"] + "</p>" +
          " </div> </div >")
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY) + "px")
          .style("display", "inline-block");
      })
      .on("mouseout", (d) => {
        div.transition()
          .duration(500)
          .style("opacity", 0);
      });

    svgBarPlot.selectAll(".text")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", (function (d) { return (map.xScale(d.Year)); }))
      .attr("y", function (d) { return map.yScale(d["Avg. Viewers (mil)"]) + 1; })
      .attr("dy", ".75em")
      .text(function (d) { return d["Avg. Viewers (mil)"]; }); 

    drawLegend(color);
  }

  function drawLegend(colorValues) {
    let legend = svgBarPlot.append("g")
      .data(colorValues.domain());
    legend.append("circle")
      .attr("cx", 600)
      .attr("cy", 130)
      .attr("r", 6)
      .style("fill", (d, i) => colorValues(i));
    legend.append("circle")
      .attr("cx", 600)
      .attr("cy", 160)
      .attr("r", 6)
      .style("fill", (d, i) => colorValues(i + 1));
    legend.append("text")
      .attr("x", 620)
      .attr("y", 130)
      .text((d, i) => colorValues.domain()[0])
      .style("font-size", "15px")
      .attr("alignment-baseline", "middle");
    legend.append("text")
      .attr("x", 620)
      .attr("y", 160)
      .text((d, i) => colorValues.domain()[1])
      .style("font-size", "15px")
      .attr("alignment-baseline", "middle")
  }

  function drawAxes(limits) {
    // return x value from a row of data
    let xValue = function (d) { return +d["Year"]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin, limits.xMax]) // give domain buffer room
      .range([60, 710]);

    // xMap returns a scaled x value from a row of data
    let xMap = function (d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale).ticks(27).tickFormat(d3.format("d"));

    svgBarPlot.append("g")
      .attr('transform', 'translate(0, 450)')
      .call(xAxis)
      .select(".domain").remove()
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-75)");

    // return y value from a row of data
    let yValue = function (d) { return +d["Avg. Viewers (mil)"] }

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
      .range([50, 450]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svgBarPlot.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {
    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin: xMin,
      xMax: xMax,
      yMin: yMin,
      yMax: yMax
    }
  }

})();
