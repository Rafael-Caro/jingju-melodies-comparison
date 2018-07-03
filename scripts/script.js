var w = 800;
var h = 300;
var paddingTop = 25;
var paddingBottom = 35;
var paddingLeft = 35;
var paddingRight = 15;
var linesColumns = 9;
var linesRows = 10;

var jingjuLinesComparison = function(dataFile) {
  d3.json(dataFile).then(function(data) {

    d3.select("svg").remove();
    d3.select(".gralBtns").remove();
    d3.selectAll(".lineSelector").remove();

    var dataset = data.melodies;
    var upbeats = data.legend.upbeats;
    var measures = data.legend.measures;
    var pitches = data.legend.pitches;
    var titles = data.legend.titles;

    var maxTMeasure = d3.max(measures, function(d) {
      return d.time
    });

    var maxTUpbeat;
    if (upbeats.length > 0) {
      maxTUpbeat = d3.max(upbeats, function (d) {return d;});
    } else {
      maxTUpbeat = 0;
    };

    var maxTMelody = d3.max(dataset, function (d) {
      var melody = d.melody;
      return d3.max(melody, function (d) {
        return Math.ceil(d.time);
      });
    });

    var maxTime = d3.max([maxTMeasure, maxTUpbeat, maxTMelody]);

    var minPitch = -2 + d3.min(dataset, function(d) {
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

    var chart = d3.select(".chart");

    var svg = chart.append("svg")
                  .attr("width", w)
                  .attr("height", h);

    var gralBtns = chart.append("div")
                       .attr("class", "gralBtns");

    var lines = d3.select(".lines")

    for (var row = 0; row < linesRows; row++) {
      for (var column = 0; column < linesColumns; column++) {
        lines.append("div")
             .attr("class", "lineSelector")
             .attr("data-row", row)
             .attr("data-column", column);
      }
    };

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
       .attr("y2", function() {
         return yScale(minPitch);
       })
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

      d.lyrics.forEach(function(d) {
        var time = xScale(+d.time);
        var lyric = d.lyric;
        svg.append("text")
           .attr("class", "lyrics")
           .attr("data-lineID", lineID)
           .attr("x", time)
           .attr("y", h-paddingBottom-10)
           .text(lyric)
           .classed("hidden", true);
      });
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
       .attr("class", "yAxisLabel")
       .attr("text-anchor", "middle")
       .attr("alignment-baseline", "middle")
       .attr("transform", "rotate(270, 6, " + (h-paddingBottom-35) + ")")
       .attr("x", 6)
       .attr("y", h-paddingBottom-35)
       .text("Scale degrees");

   svg.append("text")
      .attr("class", "xAxisLabel")
      .attr("x", paddingLeft)
      .attr("y", h)
      .text("Measures");

    svg.append("text")
       .attr("class", "title")
       .attr("x", paddingLeft)
       .attr("y", 0)
       .attr("alignment-baseline", "hanging");

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

    gralBtns.append("input")
            .attr("type", "button")
            .attr("value", "None")
            .on("click", function() {
              d3.selectAll("input.ariaCheckbox").property("checked", false);
              d3.selectAll("input.lineCheckbox").each(function() {
                var thisCheckbox = d3.select(this);
                var lineValue = thisCheckbox.property("checked");
                var lineID = thisCheckbox.attr("data-lineID");
                if (lineValue == true) {
                  d3.select(this).property("checked", false);
                  checkedLines.splice(lineID, 1);
                };
              });
            showCheckedLines();
            });


    // Buttons
    // titles.forEach(function(d, i) {
    for (var i = 0; i < titles.length; i++) {
      var row = i;
      var ariaID = titles[i].id;
      var div = d3.select(".lineSelector[data-row='" + row + "'][data-column='0']");

      div.append("input")
         .attr("class", "ariaCheckbox")
         .attr("data-ariaID", ariaID)
         .attr("data-row", row)
         .attr("type", "checkbox")
         .property("checked", true);

      div.append("label")
         .attr("class", "ariaLabel")
         .attr("data-ariaID", ariaID)
         .text(titles[i].title);

      var titleID = titles[i].id;

      var column = 1;

      dataset.forEach(function(d, i) {
        var ariaID = d.id[0];
        var lineNumber = +d.id[1]+1;
        var lineID = ariaID + "-" + lineNumber;

        if (titleID == ariaID) {

          var div = d3.select(".lineSelector[data-row='" + row + "'][data-column='" + column + "']");

          div.append("input")
              .attr("class", "lineCheckbox")
              .attr("data-ariaID", ariaID)
              .attr("data-lineID", lineID)
              .attr("data-row", row)
              .attr("type", "checkbox")
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
          column++;
        };
      });
    };

    // Utilities functions
    var highlightLine = function(ariaID, lineID) {
      var title = d3.select("path.line[data-lineID='" + lineID + "']")
                    .style("opacity", 0.8)
                    .style("stroke", "orangered")
                    .style("stroke-width", 8)
                    .attr("data-title");

      d3.select(".title")
        .text(title)
        .classed("hidden", false);

      d3.selectAll(".lyrics[data-lineID='" + lineID + "']")
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

      d3.selectAll(".lyrics[data-lineID='" + lineID + "']")
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
        var ariaCheckbox = d3.select(this);
        var ariaValue = ariaCheckbox.property("checked");
        var row = ariaCheckbox.attr("data-row");
        d3.selectAll(".lineCheckbox[data-row='" + row + "']").each(function() {
          var lineCheckbox = d3.select(this);
          var lineValue = lineCheckbox.property("checked");
          var lineID = lineCheckbox.attr("data-lineID");
          if (ariaValue) {
            if (lineValue == false) {
              lineCheckbox.property("checked", true);
              checkedLines.push(lineID);
            };
          } else {
            if (lineValue) {
              lineCheckbox.property("checked", false);
              var index = checkedLines.indexOf(lineID);
              checkedLines.splice(index, 1);
            };
          };
          showCheckedLines();
        });
      });

    d3.selectAll(".lineCheckbox")
      .on("change", function() {
        var lineID = d3.select(this).attr("data-lineID");
        var row = d3.select(this).attr("data-row");
        if (checkedLines.includes(lineID)) {
          var index = checkedLines.indexOf(lineID);
          checkedLines.splice(index, 1);
        } else {
          checkedLines.push(lineID);
        };
        showCheckedLines();
        var ariaCheckbox = d3.select(".ariaCheckbox[data-row='" + row + "']");
        var allTrue = [];
        d3.selectAll(".lineCheckbox[data-row='" + row + "']").each(function() {
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
};

var defaultFile = d3.select("input[type='radio']:checked").property("value")
jingjuLinesComparison(defaultFile);

d3.selectAll("input[type='radio']")
  .on("click", function() {
    var fileName = d3.select(this).property("value");
    jingjuLinesComparison(fileName);
  });
