var w = 800;
var h = 350;
var paddingTop = 40;
var paddingBottom = 30;
var paddingLeft = 30;
var paddingRight = 20;
var lineCheckboxLeft = 600;
var lineCheckboxSpacing = 50;
// var opacity;

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
                 .range([paddingLeft, w-paddingRight]);

  var yScale = d3.scaleLinear()
                 .domain([minPitch, maxPitch])
                 .range([h-paddingBottom, paddingTop]);

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

  var gralBtns = body.append("div")
                     .attr("class", "gralBtns");

  var form = body.append("form");

  // Pitch lines
  svg.selectAll("pitchLines")
     .data(yAxisValues)
     .enter()
     .append("line")
     .attr("x1", paddingLeft)
     .attr("x2", w-paddingRight)
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
     .attr("y1", paddingTop)
     .attr("y2", h-paddingBottom)
     .attr("class", "measureLine");

  // Upbeats lines
  svg.selectAll("upbeatLines")
     .data(upbeats)
     .enter()
     .append("line")
     .attr("x1", function(d) {return xScale(d);})
     .attr("x2", function(d) {return xScale(d);})
     .attr("y1", paddingTop)
     .attr("y2", h-paddingBottom)
     .attr("class", "upbeatLine");

  var checkedLines = [];

  // Melodies
  dataset.forEach(function(d) {
    var ariaID = d.id[0]
    var lineNumber = +d.id[1]+1
    var lineID = ariaID + "-" + lineNumber;
    var title;
    titles.forEach(function(d) {
      if (d.id == ariaID) {
        title = d.title + lineNumber;
      };
    });
    svg.append("path")
       .datum(d.melody)
       .attr("class", "line")
       .attr("data-ariaID", ariaID)
       .attr("data-lineID", lineID)
       .attr("data-title", title)
       .attr("d", line)
       .style("opacity", opacity)
       .style("stroke", "orange")
       .style("stroke-width", 8)
       .on("mouseover", function() {
         highlightLine(ariaID, lineID);
       })
       .on("mouseout", function() {
         anonymizeLine(ariaID, lineID);
       });

    checkedLines.push(ariaID + "-" + (+d.id[1]+1));
  });

  svg.append("g")
    .attr("class", "xAxis")
    .attr("transform", "translate(0," + (h - paddingBottom) + ")")
    .call(xAxis);

  svg.append("g")
    .attr("class", "yAxis")
    .attr("transform", "translate(" + paddingLeft + ",0)")
    .call(yAxis);

  svg.append("text")
     .attr("class", "title")
     .attr("x", paddingLeft)
     .attr("y", paddingTop-15);

  // General Buttons
  gralBtns.append("input")
          .attr("type", "button")
          .attr("value", "Select all")
          .on("click", function() {
            d3.selectAll("input.ariaCheckbox").property("checked", true);
            d3.selectAll("input.lineCheckbox").each(function() {
              var thisCheckbox = d3.select(this);
              var lineValue = thisCheckbox.property("checked");
              var lineID = thisCheckbox.attr("data-lineID");
              if (lineValue == false) {
                d3.select(this).property("checked", true);
                checkedLines.push(lineID);
              };
            });
          showCheckedLines();
          });


  // Buttons
  titles.forEach(function(d) {
    var div = form.append("div")
                  .attr("class", "buttonsRow");

    div.append("input")
       .attr("class", "ariaCheckbox")
       .attr("data-ariaID", d.id)
       .attr("type", "checkbox")
       .property("checked", true);
       // .property("disabled", true);

    div.append("label")
       .attr("class", "ariaLabel")
       .attr("data-ariaID", d.id)
       .text(d.title)

    // var btns = div.append("span")

    var titleID = d.id;

    dataset.forEach(function(d) {
      var ariaID = d.id[0]
      var lineNumber = +d.id[1]+1
      var lineID = ariaID + "-" + lineNumber;
      // var melodyID = d.id[0];
      // var melodyNumber = +d.id[1] + 1;
      if (titleID == ariaID) {

        div.append("input")
            .attr("class", "lineCheckbox")
            .attr("data-ariaID", ariaID)
            .attr("data-lineID", lineID)
            .attr("type", "checkbox")
            // .attr("position", "absolute")
            // .attr("left", (lineCheckboxLeft + (lineCheckboxSpacing * lineNumber)) + "px")
            .property("checked", true);

        div.append("label")
           .attr("class", "lineLabel")
           .attr("data-lineID", lineID)
           .text(lineNumber)
           .on("mouseover", function() {
             highlightLine(ariaID, lineID);
           })
           .on("mouseout", function() {
             anonymizeLine(ariaID, lineID);
           });
      };
    });
  });

  // Utilities functions
  var highlightLine = function(ariaID, lineID) {
    var title = d3.select("path.line[data-lineID='" + lineID + "']")
                  .style("opacity", 0.8)
                  .style("stroke", "orangered")
                  .style("stroke-width", 10)
                  .attr("data-title");

    d3.select(".title")
      .text(title)
      .classed("hidden", false);

    d3.select("label.ariaLabel[data-ariaID='" + ariaID + "']")
      .style("background-color", "rgba(255, 165, 0, 0.5)");

    d3.select("label.lineLabel[data-lineID='" + lineID + "']")
      .style("background-color", "rgba(255, 165, 0, 0.5)");
  };

  var anonymizeLine = function(ariaID, lineID) {
    d3.select("path.line[data-lineID='" + lineID + "']")
                  .style("opacity", opacity)
                  .style("stroke", "orange")
                  .style("stroke-width", 8);

    d3.select(".title")
      .classed("hidden", true);

    d3.select("label.ariaLabel[data-ariaID='" + ariaID + "']")
      .style("background-color", "transparent");

    d3.select("label.lineLabel[data-lineID='" + lineID + "']")
      .style("background-color", "transparent");
  };

  var showCheckedLines = function() {
    opacity = Math.ceil(10 / checkedLines.length) / 10;
    d3.selectAll("path.line")
      .select(function() {
        var line = d3.select(this);
        var lineID = line.attr("data-lineID")
        if (checkedLines.includes(lineID)) {
          line.classed("hidden", false)
          line.style("opacity", opacity);
        } else {
          line.classed("hidden", true);
        }
      });
    };

  // Control buttons
  d3.selectAll("input.ariaCheckbox")
    .on("change", function() {
      var ariaValue = d3.select(this).property("checked");
      d3.select(this.parentNode).selectAll(".lineCheckbox").each(function() {
        var thisCheckbox = d3.select(this);
        var lineValue = thisCheckbox.property("checked");
        var lineID = thisCheckbox.attr("data-lineID");
        if (ariaValue) {
          if (lineValue == false) {
            thisCheckbox.property("checked", true);
            checkedLines.push(lineID);
          }
        } else {
          if (lineValue) {
            thisCheckbox.property("checked", false);
            var index = checkedLines.indexOf(lineID);
            checkedLines.splice(index, 1);
          }
        };
        showCheckedLines();
      });
    });

  d3.selectAll(".lineCheckbox")
    .on("change", function() {
      var lineID = d3.select(this).attr("data-lineID");
      if (checkedLines.includes(lineID)) {
        var index = checkedLines.indexOf(lineID);
        checkedLines.splice(index, 1);
      } else {
        checkedLines.push(lineID);
      };
      showCheckedLines();
      var ariaCheckbox = d3.select(this.parentNode).select(".ariaCheckbox");
      var allTrue = [];
      d3.select(this.parentNode).selectAll(".lineCheckbox").each(function() {
        var lineValue = d3.select(this).property("checked");
        allTrue.push(lineValue);
      });
      if (allTrue.includes(false)) {
        ariaCheckbox.property("checked", false);
      } else {
        ariaCheckbox.property("checked", true);
      };
    });

});
