var w = 800;
var h = 350;
var padding = 40;

d3.json("code/melodies.json").then(function(data) {

  var dataset = data.melodies;
  var legend = data.legend;

  if (legend.upbeats.length > 0) {
    maxTime = d3.max(legend.upbeats, function(d) {return d;})
  } else {
    d3.max(dataset, function(d) {
      return d3.max(d.melody, function(d) {
        return d.time;
      });
    });
  };

  var minPitch = -1 + d3.min(dataset, function(d) {
    return d3.min(d.melody, function(d) {
      if (d.pitch > 0) {
        return d.pitch;
      };
    });
  });

  var maxPitch = d3.max(dataset, function(d) {
    return d3.max(d.melody, function(d) {
      return d.pitch;
    });
  });

  var xScale = d3.scaleLinear()
                 .domain([0, maxTime])
                 .range([padding, w-padding]);

  var yScale = d3.scaleLinear()
                 .domain([minPitch, maxPitch])
                 .range([h-padding, padding]);

  var xAxisValues = [];
  var xAxisLabels = [];

  legend.measures.forEach(function(d) {
    xAxisValues.push(d.time);
    xAxisLabels.push(d.value);
  });

  var xAxis = d3.axisBottom()
                .scale(xScale)
                .tickValues(xAxisValues)
                .tickFormat(function(d, i) {
                  return xAxisLabels[i];
                });

  var yAxisValues = [];
  var yAxisLabels = [];

  legend.pitches.forEach(function(d) {
    yAxisValues.push(d.midi);
    yAxisLabels.push(d.name);
  });

  var yAxis = d3.axisLeft()
                .scale(yScale)
                .tickValues(yAxisValues)
                .tickFormat(function(d, i) {
                  return yAxisLabels[i];
                });

  var line = d3.line()
               .defined(function(d) { return d.pitch > 0; })
               .x(function(d) { return xScale(d.time); })
               .y(function(d) { return yScale(d.pitch); })
               .curve(d3.curveBasis);

  var opacity = Math.ceil(10 / dataset.length) / 10;

  var svg = d3.select("body")
              .append("svg")
              .attr("width", w)
              .attr("height", h);

  // Pitch lines
  svg.selectAll("pitchLines")
     .data(yAxisValues)
     .enter()
     .append("line")
     .attr("x1", padding)
     .attr("x2", w-padding)
     .attr("y1", function(d) {return yScale(d);})
     .attr("y2", function(d) {return yScale(d);})
     .attr("class", function(d) {
       if((d == 64) || (d == 76)) {
         return "tonicLine";
       } else {
         return "pitchLine"
       };
     });

  // Measures Lines
  svg.selectAll("measureLines")
     .data(xAxisValues)
     .enter()
     .append("line")
     .attr("x1", function(d) {return xScale(d);})
     .attr("x2", function(d) {return xScale(d);})
     .attr("y1", padding)
     .attr("y2", h-padding)
     .attr("class", "measureLine");

  // Upbeats lines
  svg.selectAll("upbeatLines")
     .data(legend.upbeats)
     .enter()
     .append("line")
     .attr("x1", function(d) {return xScale(d);})
     .attr("x2", function(d) {return xScale(d);})
     .attr("y1", padding)
     .attr("y2", h-padding)
     .attr("class", "upbeatLine");

  // Melodies
  dataset.forEach(function(d) {
    svg.append("path")
       .datum(d.melody)
       .attr("class", "line")
       .attr("d", line)
       .attr("opacity", opacity);
  });

  svg.append("g")
    .attr("class", "xAxis")
    .attr("transform", "translate(0," + (h - padding) + ")")
    .call(xAxis);

  svg.append("g")
    .attr("class", "yAxis")
    .attr("transform", "translate(" + padding + ",0)")
    .call(yAxis);

});
