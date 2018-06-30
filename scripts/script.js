var w = 800;
var h = 350;
var padding = 40;

d3.json("code/melodies.json").then(function(data) {

  console.log(data);

  var dataset = data.melodies;
  var upbeats = data.legend.upbeats;
  var measures = data.legend.measures;
  var pitches = data.legend.pitches;
  var titles = data.legend.titles;

  if (upbeats.length > 0) {
    maxTime = d3.max(upbeats, function(d) {return d;})
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

  measures.forEach(function(d) {
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

  pitches.forEach(function(d) {
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

  var body = d3.select("body");

  var svg = body.append("svg")
                .attr("width", w)
                .attr("height", h);

  var form = body.append("form");

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
     .data(upbeats)
     .enter()
     .append("line")
     .attr("x1", function(d) {return xScale(d);})
     .attr("x2", function(d) {return xScale(d);})
     .attr("y1", padding)
     .attr("y2", h-padding)
     .attr("class", "upbeatLine");

  var checkedLines = [];

  // Melodies
  dataset.forEach(function(d) {
    svg.append("path")
       .datum(d.melody)
       .attr("class", "line")
       .attr("d", line)
       .attr("id", d.id[0] + "-" + (+d.id[1]+1))
       .attr("opacity", opacity)
       .on("mouseover", function() {
         d3.select(this)
           .style("opacity", 0.8)
           .style("stroke", "orangered")
           .style("stroke-width", 12);
       })
       .on("mouseout", function() {
         d3.select(this)
           .style("opacity", opacity)
           .style("stroke", "orange")
           .style("stroke-width", 8);
       })
       .on("mouseover", function() {
         d3.select(this)
          .style("opacity", 1)
          .style("stroke", "orangered")
          .style("stroke-width", 12);
       });

    checkedLines.push(d.id[0] + "-" + (+d.id[1]+1));
  });

  svg.append("g")
    .attr("class", "xAxis")
    .attr("transform", "translate(0," + (h - padding) + ")")
    .call(xAxis);

  svg.append("g")
    .attr("class", "yAxis")
    .attr("transform", "translate(" + padding + ",0)")
    .call(yAxis);

  // Buttons
  titles.forEach(function(d) {
    var div = form.append("div")

    div.append("input")
       .attr("class", "ariaCheckbox")
       .attr("type", "checkbox")
       .attr("name", d.id)
       .property("checked", true)
       .property("disabled", true);

    div.append("label")
       .text(d.title)

    var btns = div.append("span")

    var titleID = d.id;

    dataset.forEach(function(d) {
      var melodyID = d.id[0];
      var melodyNumber = +d.id[1] + 1;
      if (titleID == melodyID) {

        btns.append("input")
            .attr("class", "lineCheckbox")
            .attr("type", "checkbox")
            .attr("name", d.id[0] + "-" + (+d.id[1]+1))
            .property("checked", true);

        btns.append("label")
            .text(melodyNumber);
      };
    });
  });

  var showCheckedLines = function() {
    opacity = Math.ceil(10 / checkedLines.length) / 10;
    d3.selectAll("path.line")
      .select(function() {
        var line = d3.select(this);
        var lineID = line.attr("id")
        if (checkedLines.includes(lineID)) {
          line.style("opacity", opacity)
          line.style("pointer-events", "auto");
        } else {
          line.style("opacity", 0)
          line.style("pointer-events", "none");
        }
      });
    };

  d3.selectAll("input.lineCheckbox")
    .on("change", function() {
      var lineID = d3.select(this).attr("name");
      if (checkedLines.includes(lineID)) {
        var index = checkedLines.indexOf(lineID);
        checkedLines.splice(index, 1);
      } else {
        checkedLines.push(lineID);
      };
      showCheckedLines();
    });

});
