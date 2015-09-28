// global UI variables
var hover = null;
var candidate = null;
var polylist = [];

// options for each different drawer

var assemblePaletteOptions = {
	orientation: "vertical",
	visibleVertices: true,
	vertexRotate: true,
	visibleEdges: true,
	clickableEdges: true,
	displayInterior: true,
	groupDraggable: true,
	autoresizeSidebar: true
};

var assembleCanvasOptions = {
	orientation: "vertical",
	visibleVertices: true,
	vertexRotate: true,
	visibleEdges: true,
	clickableEdges: true,
	displayInterior: true,
	groupDraggable: true
};

var tracePatternOptions = {
	orientation: "neutral",
	patternsTraceable: true,
};

var shapeEditPaletteOptions = {
	orientation: "neutral",
	visibleVertices: true,
	vertexEdit: true,
	visibleEdges: true,
	displayInterior: true
};

var patternEditPaletteOptions = {
	orientation: "neutral",
	visibleVertices: true,
	visibleEdges: true,
	displayInterior: true,
	draggablePatterns: true
};

// create the different SVG displays

var shapeEditSVGDrawer = buildPane("#shapeEditSvg", shapeEditPaletteOptions);

var patternEditSVGDrawer = buildPane("#patternEditSvg", patternEditPaletteOptions);

var commonZoomHandler = d3.behavior.zoom().on("zoom", zoomBehavior);

var assembleSvg = buildSvg("#assembleSvg", config.standardWidth, config.standardHeight);
var assembleBg = buildBg(assembleSvg, true, true, commonZoomHandler);
var assembleCanvas = buildDisplay(assembleSvg, num.id, true);

var assemblePalette = buildDisplay(assembleSvg, num.translate(config.sidebarWidth / 2, 0));
var assemblePaletteBg = assemblePalette.append("rect")
	.classed("palette-background", true)
	.attr("width", config.sidebarWidth)
	.attr("height", "100%")
	.attr("x", - config.sidebarWidth / 2)
	.attr("y", 0)
	.style("cursor", "move")
	.call(zoomPalette);

var assemblePaletteContainer = assemblePalette.append("g")
	.classed("palette-container", true)
	.datum(function() {
		return {
			this: this,
			origTransform: num.id,
			transform: num.id,
			previousScale: 1
		};
	});

var assembleSVGDrawer = svgDrawer(assemblePaletteContainer, assemblePaletteOptions);

var traceSvg = buildSvg("#traceSvg", config.standardWidth, config.standardHeight);
var traceBg = buildBg(traceSvg, true, true, commonZoomHandler);
var traceCanvas = buildDisplay(traceSvg, assembleCanvas.datum().transform, true); // ensure they zoom the same amount

// set listeners on tile / strip view toggles
var tileView = d3.select("#tileView")
.on("click", tileViewClick);

var stripView = d3.select("#stripView")
.on("click", stripViewClick);


// set listeners on tile view UI elements

var inferButton = d3.select("#infer")
	.on("click", inferHandler)
	.classed("hidden", true);

var clearButton = d3.select("#clear")
	.on("click", function() {
		polylist = [];
		assembleCanvas.selectAll("g").remove();
		inferButton.classed("hidden", true);
	});

var deleteButton = d3.select("#delete")
	.on("click", deleteHandler);
$(deleteButton[0]).tooltip({container: 'body'});

var copyButton = d3.select("#copy")
	.on("click", copyHandler);
$(copyButton[0]).tooltip({container: 'body'});

var editPatternButton = d3.select("#editPattern")
	.on("click", function() {
		if (editPatternButton.attr("disabled") === null) {
			$("#patternModal").modal();
			var newTiles = selection.get().groupNode.__data__.tiles;
			patternEditSVGDrawer.set(_.cloneDeep(newTiles));
			patternEditSVGDrawer.draw();
			if (newTiles[0].patternParams) {
				var params = newTiles[0].patternParams;
				patternDropdown.node().value = params.index;
				$("#patternDropdown").trigger("change");
				patternSlider1.setValue(params.param1);
				patternSlider2.setValue(params.param2);
			} else {
				patternDropdown.node().value = 0;
				$("#patternDropdown").trigger("change");
			}
		}
	})
	.attr("disabled", "disabled");
$(editPatternButton[0]).tooltip({container: 'body'});

// initializing dropdown options
var shapeOptionsBuilder = (function() {
	var theta = Math.PI / 5;
	var phi = (1 + Math.sqrt(5)) / 2;
	return [
		{
			category: "Regular polygons",
			options: [{
				name: "Triangles, squares and hexagons",
				polygons: function() {
					return regularPolygonList([3,4,6]);
				},
			}, {
				name: "Squares and octagons",
				polygons: function() { return regularPolygonList([4, 8]); },
			}, {
				name: "Triangles, hexagons, squares and 12-gons",
				polygons: function() { return regularPolygonList([3, 4, 6, 12]); },
			}]
		}, {
			category: "Regular polygons with fillers",
			options: [{
				name: "10-gons with fillers",
				polygons: function() { return [regularPolygon(10), polygonFromAngles([2/5 * Math.PI, 2/5 * Math.PI, 6/5 * Math.PI, 2/5 * Math.PI, 2/5 * Math.PI, 6/5 * Math.PI], -Math.PI / 10)]; },
			}, {
				name: "12-gons with fillers",
				polygons: function() { return [regularPolygon(12), polygonFromAngles([7/6 * Math.PI, 1/3 * Math.PI, 7/6 * Math.PI, 1/3 * Math.PI, 7/6 * Math.PI, 1/3 * Math.PI, 7/6 * Math.PI, 1/3 * Math.PI], -Math.PI/6)]; },
			}, {
				name: "Octagons, 12-gons with fillers",
				polygons: function() { return [regularPolygon(8), regularPolygon(12), polygonFromAngles([5/12 * Math.PI, 5/12 * Math.PI, 7/6 * Math.PI, 5/12 * Math.PI, 5/12 * Math.PI, 7/6 * Math.PI], -1/12 * Math.PI)]; },
			}, {
				name: "Nonagons, 12-gons with fillers",
				polygons: function() { return [regularPolygon(9), regularPolygon(12), polygonFromAngles([7/18 * Math.PI, 7/18 * Math.PI, 11/9 * Math.PI, 7/18 * Math.PI, 7/18 * Math.PI, 11/9 * Math.PI], -1/9 * Math.PI)]; },
			}, {
				name: "Octagons, 16-gons with fillers",
				polygons: function() { return [regularPolygon(16), regularPolygon(8), polygonFromAngles([9/8 * Math.PI, 9/8 * Math.PI, 3/8 * Math.PI, 3/8 * Math.PI, 9/8 * Math.PI, 9/8 * Math.PI, 3/8 * Math.PI, 3/8 * Math.PI], Math.PI / 8)]; },
			}, {
				name: "18-gons with fillers",
				polygons: function() { return [regularPolygon(18), polygonFromAngles([10/9 * Math.PI, 2/9 * Math.PI, 10/9 * Math.PI, 2/9 * Math.PI, 10/9 * Math.PI, 2/9 * Math.PI], -5/18 * Math.PI)]; },
			}]
		}, {
			category: "Almost-regular polygons",
			options: [{
				name: "Heptagons and pentagons",
				polygons: function() { return [regularPolygon(7), polygonFromAnglesAndLengths([9/14*Math.PI, 4/7 * Math.PI, 4/7 * Math.PI, 4/7 * Math.PI, 9/14*Math.PI], [0.696,1,1,1,1], Math.PI)]; },
			}, {
				name: "Altair tiling",
				polygons: function() { return [regularPolygon(8), regularPolygon(6), polygonFromAngles([Math.PI * 7/12, 2.01825, 1.723, 2.01825, Math.PI * 7/12], Math.PI),
					polygonFromAnglesAndLengths([3/4*Math.PI, 2.2786, 2.1697, Math.PI * 2/3, 2.1697, 2.2786, 3/4 * Math.PI], [0.779, 0.779, 1, 1, 1, 1, 0.779], Math.PI),
					polygonFromAnglesAndLengths([Math.PI/2, Math.PI/2, Math.PI/2, Math.PI/2], [0.779, 0.779,0.779,0.779])]; },
			}]
		}, {
			category: "Quasiperiodic tilings",
			options: [{
				name: "Pentagons and rhombuses",
				polygons: function() { return [regularPolygon(5), polygonFromAngles([1/5*Math.PI, 4/5 * Math.PI, 1/5 * Math.PI, 4/5 * Math.PI], Math.PI / 10)]; },
			}, {
				name: "Heptagonal rhombuses",
				polygons: function() { return [polygonFromAnglesAndLengths([2/7*Math.PI, 5/7 * Math.PI, 2/7 * Math.PI, 5/7 * Math.PI], [2,2,2,2],0), polygonFromAnglesAndLengths([3/7*Math.PI, 4/7 * Math.PI, 3/7 * Math.PI, 4/7 * Math.PI], [2,2,2,2],0), polygonFromAnglesAndLengths([1/7*Math.PI, 6/7 * Math.PI, 1/7 * Math.PI, 6/7 * Math.PI], [2,2,2,2],0)]; },
			}, {
				name: "Penrose rhombuses",
				polygons: function() { return [polygonFromAngles([theta, 4*theta, theta, 4*theta], theta / 2), polygonFromAngles([2*theta, 3*theta, 2*theta, 3*theta], theta)]; },
			}, {
				name: "Penrose kites and darts",
				polygons: function() { return [polygonFromAnglesAndLengths([2*theta, 4*theta, 2*theta, 2*theta], [phi, 1, 1, phi], -Math.PI/2 - theta), polygonFromAnglesAndLengths([theta, 2*theta, theta, 6*theta], [1, phi, phi, 1], -theta/2)]; },
			}, {
				name: "Girih tiles",
				polygons: function() { return [regularPolygon(10), regularPolygon(5), polygonFromAngles([2*theta, 3*theta, 2*theta, 3*theta]),
					polygonFromAngles([6*theta, 2*theta, 2*theta, 6*theta, 2*theta, 2*theta]),
					polygonFromAngles([2*theta, 4*theta, 4*theta, 2*theta, 4*theta, 4*theta])];
				}
			}]
		}];
})();

var shapeOptions = _.flatten(_.pluck(shapeOptionsBuilder, "options")).concat({name: "Custom", polygons: function() { return []; }});

var shapeDropdown = d3.select("#shapeDropdown");

shapeDropdown.selectAll("optgroup").data(shapeOptionsBuilder).enter()
	.append("optgroup")
	.attr("label", function(d) { return d.category; })
	.selectAll("option").data(function(d) { return d.options; }).enter()
	.append("option")
	.html(function(d) {return d.name;});

shapeDropdown.append("option").html("Custom");

shapeDropdown.selectAll("option")
	.attr("value", function(d, i) {return i;});

var patternDropdown = d3.select("#patternDropdown");

patternDropdown.selectAll("option").data(patternOptions).enter()
	.append("option")
	.attr("value", function(d, i) {return i;})
	.html(function(d) {return d.name;});

// set listeners on custom shape UI elements

var shapeEditToggleButton = d3.select("#shapeEditToggle")
	.on("click", shapeEditToggle);

var addToLineupButton = d3.select("#addToLineup")
	.on("click", addToLineupClick);

var addToLineupManualButton = d3.select("#addToLineupManual")
	.on("click", addToLineupManualClick);

var sideNumberSlider = new Slider("#sideNumber", {
	min: 3,
	max: 18,
	step: 1,
	value: 9,
	formatter: function(value) {
		return 'Current value: ' + value;
	}
}).on("change", shapeEditCustomDraw);

var sideLengthSlider = new Slider('#sideLength', {
	min: 0.5,
	max: 4,
	step: 0.05,
	value: 1,
	formatter: function(value) {
		return 'Current value: ' + value;
	}
}).on("change", shapeEditCustomDraw);

shapeEditCustomDraw();

// set listeners on edit pattern UI elements

var confirmPatternButton = d3.select("#confirmPattern")
	.on("click", updateTileWithPatternClick);

var newCustomPatternButton = d3.select("#newCustomPattern")
	.on("click", newCustomPatternClick);

var deleteCustomPatternButton = d3.select("#deleteCustomPattern")
	.on("click", deleteCustomPatternClick);

var startOffset = new Slider('#startOffset', {
	value: 0,
	min: -0.5,
	max: 0.5,
	step: 0.01,
	formatter: function(value) {
		return 'Current value: ' + value;
	}
})
.on("change", patternUpdate);

var endOffset = new Slider('#endOffset', {
	value: 0,
	min: -0.5,
	max: 0.5,
	step: 0.01,
	formatter: function(value) {
		return 'Current value: ' + value;
	}
})
.on("change", patternUpdate);

$('form input[name=symmetryRadios][type=radio]:checked')
.change(patternUpdate);

$('form input[name=edgeRadios][type=radio]:checked')
.change(patternUpdate);

var degreesOfFreedom = new Slider('#degreesOfFreedom', {
	value: 1,
	min: 0,
	max: 4,
	step: 1,
	formatter: function(value) {
		return 'Current value: ' + value;
	}
}).on("change", patternUpdate);

var patternSlider1 = {
	destroy : function() {}
};

var patternSlider2 = {
	destroy : function() {}
};

// set listener on strip view UI elements

var stripColors = [
	{hex: "#F44336", name: "Red" },
	{hex: "#E91E63", name: "Pink"},
	{hex: "#9c26b0", name: "Purple"},
	{hex: "#673AB7", name: "Deep Purple"},
	{hex: "#3F51B5", name: "Indigo"},
	{hex: "#2196F3", name: "Blue"},
	{hex: "#03A9F4", name: "Light Blue"},
	{hex: "#00BCD4", name: "Cyan"},
	{hex: "#009688", name: "Teal"},
	{hex: "#4CAF50", name: "Green"},
	{hex: "#8BC34A", name: "Light Green"},
	{hex: "#CDDC39", name: "Lime"},
	{hex: "#FFEB3B", name: "Yellow"},
	{hex: "#FFC107", name: "Amber"},
	{hex: "#FF9800", name: "Orange"},
	{hex: "#FF5722", name: "Deep Orange"},
	{hex: "#795548", name: "Brown"},
	{hex: "#9E9E9E", name: "Grey"},
	{hex: "#607D8B", name: "Blue Grey"}
];

d3.select("#colorpicker").selectAll("option")
.data(stripColors)
.enter()
.append("option")
.attr("value", function(d) { return d.hex; })
.html(function(d) { return d.name; });

var thicknessSlider = new Slider("#thickness", {
	min: 0,
	max: 10,
	step: 0.1,
	value: 3,
	formatter: function(value) {
		return 'Current value: ' + value;
	}
}).on("change", thicknessSliderChange);

var extensionSlider = new Slider("#extensionLength", {
	min: 0,
	max: 2,
	step: 0.01,
	value: 0.4,
	formatter: function(value) {
		return 'Current value: ' + value;
	}
}).on("change", extensionSliderChange);

var outlineToggle = d3.select("#outlineToggle")
.on("click", function() {
	d3.selectAll("path.strip-outline")
	.attr("visibility", outlineToggle.classed("active") ? "hidden" : "visible");
});

// generate dyanmic stylesheet for coloring
var newStylesheet = function() {
	// Create the <style> tag
	var style = document.createElement("style");

	// WebKit hack :(
	style.appendChild(document.createTextNode(""));

	// Add the <style> element to the page
	document.head.appendChild(style);

	return style.sheet;
};

var stylesheet = newStylesheet();

// initialize advanced SVG generation options UI elements

var advancedOptions = d3.select("#advancedOptions")
.on("click", function() {
	$('#advancedModal').modal();
});

var stripHeight = new Slider("#stripHeight", {
	min: 10,
	max: 50,
	step: 1,
	value: 25,
	formatter: function(value) {
		return 'Current value: ' + value;
	}
});

var widthFactor = new Slider("#widthFactor", {
	min: 0.1,
	max: 5,
	step: 0.1,
	value: 2,
	formatter: function(value) {
		return 'Current value: ' + value;
	}
});

var interSpacing = new Slider("#interSpacing", {
	min: 0,
	max: 50,
	step: 1,
	value: 15,
	formatter: function(value) {
		return 'Current value: ' + value;
	}
});

var printHeight = new Slider("#printHeight", {
	min: 0,
	max: 3000,
	step: 10,
	value: 1620,
	formatter: function(value) {
		return 'Current value: ' + value;
	}
});

var printWidth = new Slider("#printWidth", {
	min: 0,
	max: 3000,
	step: 10,
	value: 2880,
	formatter: function(value) {
		return 'Current value: ' + value;
	}
});


$(".collapse").collapse({toggle: true});

d3.select("#generateCustomStripBtn")
  .on("click", generateCustomStrip);

// wrap jQuery plugins in document.ready
$(document).ready(function() {
	$("#colorpicker").simplecolorpicker({theme: 'regularfont'})
	.on("change", function() {
		stylesheet.deleteRule(0);
		stylesheet.insertRule("path.strip.hover { stroke: " + $("#colorpicker").val() + " !important }", 0);
	});

	$("#shapeDropdown").select2({
		    minimumResultsForSearch: Infinity
	})
	.on("change", shapeDropdownChange).trigger("change");

	$("#patternDropdown").select2({
		    minimumResultsForSearch: Infinity
	})
	.on("change", patternDropdownChange);

	stylesheet.insertRule("path.strip.hover { stroke: " + $("#colorpicker").val() + " !important }", 0);
});