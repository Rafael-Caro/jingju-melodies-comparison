var w = 800;
var h = 350;
var paddingTop = 60;
var paddingBottom = 30;
var paddingLeft = 30;
var paddingRight = 20;

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
        title = d.title + "-" + lineNumber;
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

    div.append("input")
       .attr("class", "ariaCheckbox")
       .attr("data-ariaID", d.id)
       .attr("type", "checkbox")
       .property("checked", true);
       // .property("disabled", true);

    div.append("label")
       .text(d.title)

    // var btns = div.append("span")

    var titleID = d.id;

    dataset.forEach(function(d) {
      var melodyID = d.id[0];
      var melodyNumber = +d.id[1] + 1;
      if (titleID == melodyID) {

        div.append("input")
            .attr("class", "lineCheckbox")
            .attr("data-ariaID", d.id[0])
            .attr("data-lineID", d.id[0] + "-" + (+d.id[1]+1))
            .attr("type", "checkbox")
            .property("checked", true);

        div.append("label")
            .text(melodyNumber);
      };
    });
  });

  var showCheckedLines = function() {
    opacity = Math.ceil(10 / checkedLines.length) / 10;
    d3.selectAll("path.line")
      .select(function() {
        var line = d3.select(this);
        var lineID = line.attr("data-lineID")
        if (checkedLines.includes(lineID)) {
          line.style("opacity", opacity)
          line.style("pointer-events", "auto");
        } else {
          line.style("opacity", 0)
          line.style("pointer-events", "none");
        }
      });
    };

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
