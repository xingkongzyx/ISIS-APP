/** ---------------------------------------- DOM 变量 ----------------------------------------------- */
var loader, svg, textSize, w, h, isMapProjected;

var toggleScalebar = true,
	userTextColor,
	drawFlag = false,
	textBoxArray = [];

var clickArray = [],
	lineArr = [];

var mouseX, mouseY, startX, startY;

var northDegree, sunDegree, observerDegree;

var placeEnum = new Object({
	"top-left": 1,
	"top-right": 2,
	"bottom-right": 3,
	"bottom-left": 4
});

var sunImage, northImage, outlineBox, eyeImage, eyeArrow, scaleBarIcon, bg;
/** ----------------------------------------  DOM 变量 ------------------------------------------- */

/** ---------------------------- 可拖动方程 ------------------------------------------------------ */

function makeDraggable(event) {
	var svg = event;

	svg.addEventListener("mousedown", startDrag);
	svg.addEventListener("mousemove", drag);
	svg.addEventListener("mouseup", endDrag);
	svg.addEventListener("mouseleave", endDrag);

	var selectedElement,
		offset,
		transform,
		bbox,
		minX,
		maxX,
		minY,
		maxY,
		confined,
		elementOver;
	var resizing = false,
		dragging = false,
		currentScale,
		startH,
		startW,
		minNorth = 0.1219513,
		maxNorth = 1.219513,
		minSun = 0.15625,
		maxSun = 1.5625,
		minEye = 0.52,
		maxEye = 5.2,
		maxText = textSize * 10,
		minText = textSize,
		iconMin,
		iconMax,
		outlineMin = 0.125,
		scale;

	var boundaryX1 = Number(svg.getAttribute("viewBox").split(" ")[0]);
	var boundaryX2 =
		Number(svg.getAttribute("viewBox").split(" ")[2]) -
		Math.abs(Number(svg.getAttribute("viewBox").split(" ")[0]));
	var boundaryY1 = Number(svg.getAttribute("viewBox").split(" ")[1]);
	var boundaryY2 =
		Number(svg.getAttribute("viewBox").split(" ")[3]) -
		Math.abs(Number(svg.getAttribute("viewBox").split(" ")[1]));

	function getMousePosition(event) {
		var CTM = svg.getScreenCTM();
		return {
			x: (event.clientX - CTM.e) / CTM.a,
			y: (event.clientY - CTM.f) / CTM.d
		};
	}

	function startDrag(event) {
		(mX = event.clientX), (mY = event.clientY);
		event.preventDefault();
		elementOver = document.elementFromPoint(mX, mY);
		selectedElement = event.target.parentNode;

		if (selectedElement === svg) {
			selectedElement = event.target;
		}

		if (selectedElement) {
			iconMin = findLimit(selectedElement, true);
			iconMax = findLimit(selectedElement, false);
		}

		try {
			bbox = selectedElement.getBBox();
		} catch (err) {
			return;
		}
		var transforms = selectedElement.transform.baseVal;

		if (elementOver.classList.contains("resize") && !resizing) {
			resizing = true;

			scale = transforms.getItem(transforms.length - 1);

			offset = getMousePosition(event);

			currentScale = scale.matrix.a;

			transform = transforms.getItem(0);
		} else if (selectedElement.classList.contains("draggable")) {
			dragging = true;
			offset = getMousePosition(event);
			scale = transforms.getItem(transforms.length - 1);

			if (
				transforms.length === 0 ||
				transforms.getItem(0).type !==
					SVGTransform.SVG_TRANSFORM_TRANSLATE
			) {
				var translate = svg.createSVGTransform();
				translate.setTranslate(0, 0);
				selectedElement.transform.baseVal.insertItemBefore(
					translate,
					0
				);
			}

			transform = transforms.getItem(0);

			offset.x -= transform.matrix.e;
			offset.y -= transform.matrix.f;

			confined = selectedElement.classList.contains("confine");

			if (confined) {
				let rotateVal = transforms.getItem(1).angle;
				if (rotateVal > 360) {
					rotateVal -= 360;
				}

				let scaleFactor = scale.matrix.a;
				bbox = selectedElement.getBBox();

				if (rotateVal === 0 || rotateVal === 360) {
					minX = boundaryX1 - bbox.x;
					maxX = boundaryX2 - bbox.x - bbox.width * scaleFactor;
					minY = boundaryY1 - bbox.y;
					maxY = boundaryY2 - bbox.y - bbox.height * scaleFactor;
				} else {
					var trigInput = (rotateVal * Math.PI) / 180;
					var trigInput2 = ((rotateVal - 90) * Math.PI) / 180;
					var trigInput3 = ((rotateVal - 180) * Math.PI) / 180;
					var trigInput4 = ((rotateVal - 270) * Math.PI) / 180;

					if (rotateVal === 180) {
						minX = boundaryX1 - bbox.x + bbox.width * scaleFactor;
						maxX = boundaryX2 - bbox.x;
						minY = boundaryY1 - bbox.y + bbox.height * scaleFactor;
						maxY = boundaryY2 - bbox.y;
					} else if (rotateVal === 90) {
						minX = boundaryX1 - bbox.x + bbox.height * scaleFactor;
						maxX = boundaryX2 - bbox.x;
						minY = boundaryY1 - bbox.y;
						maxY = boundaryY2 - bbox.y - bbox.width * scaleFactor;
					} else if (rotateVal === 270) {
						minX = boundaryX1 - bbox.x;
						maxX = boundaryX2 - bbox.x - bbox.height * scaleFactor;
						minY = boundaryY1 - bbox.y + bbox.width * scaleFactor;
						maxY = boundaryY2 - bbox.y;
					} else if (rotateVal === 45) {
						minX =
							boundaryX1 -
							bbox.x +
							(bbox.height * scaleFactor) / Math.sqrt(2);
						maxX =
							boundaryX2 -
							bbox.x -
							(bbox.width * scaleFactor) / Math.sqrt(2);
						minY = boundaryY1 - bbox.y;
						maxY =
							boundaryY2 -
							bbox.y -
							(bbox.width * scaleFactor) / Math.sqrt(2) -
							(bbox.height * scaleFactor) / Math.sqrt(2);
					} else if (rotateVal === 135) {
						minX =
							boundaryX1 -
							bbox.x +
							((bbox.height * scaleFactor) / Math.sqrt(2) +
								(bbox.width * scaleFactor) / Math.sqrt(2));
						maxX = boundaryX2 - bbox.x;
						minY =
							boundaryY1 -
							bbox.y +
							(bbox.height * scaleFactor) / Math.sqrt(2);
						maxY =
							boundaryY2 -
							bbox.y -
							(bbox.width * scaleFactor) / Math.sqrt(2);
					} else if (rotateVal === 225) {
						minX =
							boundaryX1 -
							bbox.x +
							(bbox.width * scaleFactor) / Math.sqrt(2);
						maxX =
							boundaryX2 -
							bbox.x -
							(bbox.height * scaleFactor) / Math.sqrt(2);
						minY =
							boundaryY1 -
							bbox.y +
							(bbox.height * scaleFactor) / Math.sqrt(2) +
							(bbox.width * scaleFactor) / Math.sqrt(2);
						maxY = boundaryY2 - bbox.y;
					} else if (rotateVal === 315) {
						minX = boundaryX1 - bbox.x;
						maxX =
							boundaryX2 -
							bbox.x -
							(bbox.height * scaleFactor) / Math.sqrt(2) -
							(bbox.width * scaleFactor) / Math.sqrt(2);
						minY =
							boundaryY1 -
							bbox.y +
							(bbox.width * scaleFactor) / Math.sqrt(2);
						maxY =
							boundaryY2 -
							bbox.y -
							(bbox.height * scaleFactor) / Math.sqrt(2);
					} else if (rotateVal < 90) {
						minX =
							boundaryX1 -
							bbox.x +
							Math.sin(trigInput) * (bbox.height * scaleFactor);
						maxX =
							boundaryX2 -
							bbox.x -
							Math.cos(trigInput) * (bbox.width * scaleFactor);
						minY = boundaryY1 - bbox.y;
						maxY =
							boundaryY2 -
							bbox.y -
							(Math.cos(trigInput) * (bbox.height * scaleFactor) +
								Math.sin(trigInput) *
									(bbox.width * scaleFactor));
					} else if (rotateVal < 180) {
						minX =
							boundaryX1 -
							bbox.x +
							Math.sin(trigInput2) * (bbox.width * scaleFactor) +
							Math.cos(trigInput2) * (bbox.height * scaleFactor);
						maxX = boundaryX2 - bbox.x;
						minY =
							boundaryY1 -
							bbox.y +
							Math.sin(trigInput2) * (bbox.height * scaleFactor);
						maxY =
							boundaryY2 -
							bbox.y -
							Math.cos(trigInput2) * (bbox.width * scaleFactor);
					} else if (rotateVal < 270) {
						minX =
							boundaryX1 -
							bbox.x +
							Math.cos(trigInput3) * (bbox.width * scaleFactor);
						maxX =
							boundaryX2 -
							bbox.x -
							Math.sin(trigInput3) * (bbox.height * scaleFactor);
						minY =
							boundaryY1 -
							bbox.y +
							Math.cos(trigInput3) * (bbox.height * scaleFactor) +
							Math.sin(trigInput3) * (bbox.width * scaleFactor);
						maxY = boundaryY2 - bbox.y;
					} else if (rotateVal < 360) {
						minX = boundaryX1 - bbox.x;
						maxX =
							boundaryX2 -
							bbox.x -
							Math.cos(trigInput4) * (bbox.height * scaleFactor) -
							Math.sin(trigInput4) * (bbox.width * scaleFactor);
						minY =
							boundaryY1 -
							bbox.y +
							Math.cos(trigInput4) * (bbox.width * scaleFactor);
						maxY =
							boundaryY2 -
							bbox.y -
							Math.sin(trigInput4) * (bbox.height * scaleFactor);
					}
				}
			}
		}
	}

	var bottomL = false,
		bottomR = false,
		topR = false,
		topL = false;

	function drag(event) {
		(mX = event.clientX), (mY = event.clientY);

		let growingFactor = 0.02;

		if (
			elementOver &&
			elementOver.parentElement &&
			elementOver.parentElement.classList.contains("textbox")
		) {
			growingFactor *= 5;
		} else if (selectedElement && selectedElement.id.indexOf("eye") > -1) {
			growingFactor *= 2.5;
		}

		if (selectedElement) {
			var isOutline = selectedElement.classList.contains("outline");
		}

		event.preventDefault();

		if (selectedElement && resizing && !dragging) {
			var coord = getMousePosition(event);

			startH = bbox.height * currentScale;
			startW = bbox.width * currentScale;

			if (
				!topL &&
				!bottomL &&
				!bottomR &&
				(elementOver.classList.contains("top-right") || topR)
			) {
				topR = true;
				if (coord.x < offset.x && coord.y > offset.y) {
					currentScale -= growingFactor;
					if (currentScale < iconMin) {
						currentScale = iconMin;
					}

					dx = parseInt(transform.matrix.e);
					dy = parseInt(
						transform.matrix.f +
							Math.abs(startH - bbox.height * currentScale) / 4
					);
				} else if (coord.x > offset.x && coord.y < offset.y) {
					currentScale += growingFactor;

					if (currentScale > iconMax) {
						currentScale = iconMax;
					}
					if (
						!isOutline &&
						bbox.height * currentScale > parseInt(h) / 3
					) {
						currentScale -= growingFactor;
					}

					dx = parseInt(transform.matrix.e);
					dy = parseInt(
						transform.matrix.f -
							Math.abs(startH - bbox.height * currentScale) / 4
					);
				}

				scale.setScale(currentScale, currentScale);

				offset = coord;
			} else if (
				!topR &&
				!bottomL &&
				!bottomR &&
				(elementOver.classList.contains("top-left") || topL)
			) {
				topL = true;
				if (coord.x > offset.x && coord.y > offset.y) {
					currentScale -= growingFactor;
					if (currentScale < iconMin) {
						currentScale = iconMin;
					}

					dx = parseInt(
						transform.matrix.e +
							Math.abs(startW - bbox.width * currentScale) / 4
					);
					dy = parseInt(
						transform.matrix.f +
							Math.abs(startH - bbox.height * currentScale) / 4
					);
				} else if (coord.x < offset.x && coord.y < offset.y) {
					currentScale += growingFactor;

					if (currentScale > iconMax) {
						currentScale = iconMax;
					}
					if (
						!isOutline &&
						(bbox.height * currentScale > parseInt(h) / 3 ||
							bbox.width * currentScale > parseInt(w) / 3)
					) {
						currentScale -= growingFactor;
					}

					dx = parseInt(
						transform.matrix.e -
							Math.abs(startW - bbox.width * currentScale) / 4
					);
					dy = parseInt(
						transform.matrix.f -
							Math.abs(startH - bbox.height * currentScale) / 4
					);
				}

				scale.setScale(currentScale, currentScale);

				offset = coord;
			} else if (
				!bottomR &&
				!topR &&
				!topL &&
				(elementOver.classList.contains("bottom-left") || bottomL)
			) {
				bottomL = true;
				if (coord.x > offset.x && coord.y < offset.y) {
					currentScale -= growingFactor;
					if (currentScale < iconMin) {
						currentScale = iconMin;
					}

					dx = parseInt(
						transform.matrix.e +
							Math.abs(startW - bbox.width * currentScale) / 4
					);
					dy = parseInt(transform.matrix.f);
				} else if (coord.x < offset.x && coord.y > offset.y) {
					currentScale += growingFactor;

					if (currentScale > iconMax) {
						currentScale = iconMax;
					}
					if (
						!isOutline &&
						bbox.height * currentScale > parseInt(h) / 3
					) {
						currentScale -= growingFactor;
					}

					dx = parseInt(
						transform.matrix.e -
							Math.abs(startW - bbox.width * currentScale) / 4
					);
					dy = parseInt(transform.matrix.f);
				}

				scale.setScale(currentScale, currentScale);

				offset = coord;
			} else if (
				!topL &&
				!topR &&
				!bottomL &&
				(elementOver.classList.contains("bottom-right") || bottomR)
			) {
				bottomR = true;
				if (coord.x < offset.x && coord.y < offset.y) {
					currentScale -= growingFactor;
					if (currentScale < iconMin) {
						currentScale = iconMin;
					}
				} else if (coord.x > offset.x && coord.y > offset.y) {
					currentScale += growingFactor;

					if (currentScale > iconMax) {
						currentScale = iconMax;
					}
					if (
						!isOutline &&
						bbox.height * currentScale > parseInt(h) / 3
					) {
						currentScale -= growingFactor;
					}
				}
				scale.setScale(currentScale, currentScale);
				offset = coord;
			}

			if (isOutline) {
				selectedElement.style.strokeWidth =
					(parseInt(selectedElement.getAttribute("stroke-width")) /
						currentScale) *
					0.5;
			}
			if (
				isOutline ||
				selectedElement.classList.contains("textbox") ||
				selectedElement.id === "eyePosition"
			) {
				if (dx && dy) {
					transform.setTranslate(parseInt(dx), parseInt(dy));
				}
			}
		} else if (selectedElement && dragging) {
			var coord = getMousePosition(event);
			var dx = parseInt(coord.x - offset.x);
			var dy = parseInt(coord.y - offset.y);

			if (confined) {
				if (dx < minX) {
					dx = minX;
				} else if (dx > maxX) {
					dx = maxX;
				}
				if (dy < minY) {
					dy = minY;
				} else if (dy > maxY) {
					dy = maxY;
				}
			}
			transform.setTranslate(dx, dy);
		}
	}

	function endDrag(event) {
		if (selectedElement) {
			drag(event);
			(resizing = false),
				(dragging = false),
				(bottomL = false),
				(bottomR = false),
				(topL = false),
				(topR = false);
		}
		selectedElement = null;
	}

	function findLimit(selectedElement, isMin) {
		if (selectedElement && selectedElement !== "null") {
			if (isMin) {
				if (selectedElement.id.indexOf("north") !== -1) {
					return minNorth;
				} else if (selectedElement.id.indexOf("sun") !== -1) {
					return minSun;
				} else if (selectedElement.id.indexOf("eye") !== -1) {
					return minEye;
				} else if (selectedElement.id.indexOf("attension") !== -1) {
					return outlineMin;
				} else if (
					selectedElement.getAttribute("class") &&
					selectedElement.getAttribute("class").indexOf("text") !== -1
				) {
					return minText;
				} else {
					return 0.05;
				}
			} else {
				if (selectedElement.id.indexOf("north") !== -1) {
					return maxNorth;
				} else if (selectedElement.id.indexOf("sun") !== -1) {
					return maxSun;
				} else if (selectedElement.id.indexOf("eye") !== -1) {
					return maxEye;
				} else if (
					selectedElement.getAttribute("class") &&
					selectedElement.getAttribute("class").indexOf("text") !== -1
				) {
					return maxText;
				} else {
					return 2;
				}
			}
		}
	}
}
/** ------------------------------------- 可拖动方程 ----------------------------------------- */

/** ------------------------------------------ Helper Function ------------------------------------------- */

function setSvgClickDetection(svg, mouseDetect) {
	let svgElements = svg.childNodes;

	for (index in svgElements) {
		if (
			svgElements[index].classList &&
			svgElements[index].classList.contains("draggable")
		) {
			svgElements[index].style.pointerEvents = mouseDetect;
			if (svgElements[index].childNodes) {
				for (index2 in svgElements[index].childNodes) {
					if (
						svgElements[index].childNodes[index2].classList &&
						svgElements[index].childNodes[
							index2
						].classList.contains("resize")
					) {
						svgElements[index].childNodes[
							index2
						].style.pointerEvents = mouseDetect;
					}
				}
			}
		}
	}
}

function captionHandler() {
	if (document.referrer.indexOf("/captionWriter") > -1) {
		window.history.back();
	} else {
		window.open("/captionWriter", "_self");
	}
}

function growProgress(duration) {
	document.getElementById("mainBar").style.animation =
		"growBar " + duration + "s linear";
	document.getElementById("mainBar").style.webkitAnimation =
		"growBar " + duration + "s linear";
}

function showProgress() {
	var elem = document.getElementById("progressBar");
	elem.style.visibility = "visible";
}

function hideProgress() {
	var elem = document.getElementById("progressBar");
	document.getElementById("mainBar").style.animation = "";
	document.getElementById("mainBar").style.webkitAnimation = "";
	elem.style.visibility = "hidden";
}

function loadInvisible() {
	loader.style.visibility = "hidden";
}

function loaderActivate() {
	loader.style.visibility = "visible";
}

function setOpposite(colorString) {
	if (colorString === "black") {
		return "white";
	} else {
		return "black";
	}
}

function drawLine(lineElement, x2, y2) {
	lineElement.setAttribute("x2", x2);
	lineElement.setAttribute("y2", y2);
}

function getMetadata() {
	var metadata = document.getElementById("metadata-text").innerHTML;

	var metadataString = JSON.parse(metadata);

	northDegree = parseFloat(metadataString["NorthAzimuth"]) + 90;
	sunDegree = parseFloat(metadataString["SubSolarAzimuth"]) + 90;
	observerDegree =
		parseFloat(metadataString["SubSpacecraftGroundAzimuth"]) + 90;

	if (isNaN(northDegree)) {
		if (isMapProjected) {
			let rotateOffset = parseFloat("<%=rotationOffset %>");
			if (!isNaN(rotateOffset)) {
				northDegree = 0 + rotateOffset;
			}
		} else {
			document
				.getElementById("northIconFlag")
				.setAttribute(
					"class",
					"btn btn-secondary btn-lg button disabled"
				);
		}
	}

	if (isNaN(sunDegree)) {
		document
			.getElementById("sunIconFlag")
			.setAttribute("class", "btn btn-secondary btn-lg button disabled");
	}

	if (isNaN(observerDegree)) {
		document
			.getElementById("eyeFlag")
			.setAttribute("class", "btn btn-secondary btn-lg button disabled");
	}

	if (northDegree > 360) {
		northDegree -= 360;
	}
	if (sunDegree > 360) {
		sunDegree -= 360;
	}
	if (observerDegree > 360) {
		observerDegree -= 360;
	}
	setScaleboxCorners(northDegree, sunDegree);
}

getNameWithVal = function(val) {
	let tmpArr = Object.keys(placeEnum);
	for (key in tmpArr) {
		if (placeEnum[tmpArr[key]] === val) {
			return tmpArr[key];
		}
	}
};

Image.prototype.load = function(url) {
	var thisImg = this;
	var xmlHTTP = new XMLHttpRequest();
	xmlHTTP.open("GET", url, true);
	xmlHTTP.responseType = "arraybuffer";
	xmlHTTP.onload = function(e) {
		var blob = new Blob([this.response]);
		thisImg.src = window.URL.createObjectURL(blob);
	};
	xmlHTTP.onprogress = function(e) {
		thisImg.completedPercentage = parseInt((e.loaded / e.total) * 100);
	};
	xmlHTTP.onloadstart = function() {
		thisImg.completedPercentage = 0;
	};
	xmlHTTP.send();
};

Image.prototype.completedPercentage = 0;

function loadImageAsURL(url, callback) {
	var image = new Image();

	image.onload = function() {
		var canvas = document.createElement("canvas");

		console.log(
			"This image is: " +
				this.naturalWidth +
				" by " +
				this.naturalHeight +
				" px is demension"
		);
		console.log(
			"And has " +
				this.naturalWidth * this.naturalHeight +
				" total number of pixels"
		);

		canvas.width = this.naturalWidth;
		canvas.height = this.naturalHeight;

		canvas.getContext("2d").drawImage(this, 0, 0);
		callback(canvas.toDataURL("image/png"));
	};
	image.onerror = function(err) {
		console.log("Error: " + err);
	};
	image.src = url;
}

function setImagePadding(val, location) {
	let imageW, imageH;

	switch (location) {
		case "bottom":
			imageH = h + val;
			svg.setAttribute("viewBox", "0 0 " + w + " " + imageH);

			bg.setAttribute("x", 0);
			bg.setAttribute("y", 0);

			bg.setAttribute("height", imageH);
			bg.setAttribute("width", w);

			svg.setAttribute("height", imageH);
			svg.setAttribute("width", w);
			makeDraggable(svg);
			break;

		case "top":
			imageH = h + val;
			bg.setAttribute("y", val * -1);
			bg.setAttribute("x", 0);
			bg.setAttribute("height", imageH);
			bg.setAttribute("width", w);

			svg.setAttribute(
				"viewBox",
				"0 " + String(val * -1) + " " + w + " " + imageH
			);

			svg.setAttribute("height", imageH);
			svg.setAttribute("width", w);
			makeDraggable(svg);
			break;

		case "right":
			imageW = w + val;
			bg.setAttribute("y", 0);
			bg.setAttribute("x", 0);
			bg.setAttribute("width", imageW);
			bg.setAttribute("height", h);

			svg.setAttribute("viewBox", "0 0 " + imageW + " " + h);

			svg.setAttribute("width", imageW);
			svg.setAttribute("height", h);
			makeDraggable(svg);
			break;

		case "left":
			imageW = w + val;
			bg.setAttribute("y", 0);
			bg.setAttribute("x", val * -1);
			bg.setAttribute("width", imageW);
			bg.setAttribute("height", h);

			svg.setAttribute(
				"viewBox",
				String(val * -1) + " 0 " + imageW + " " + h
			);

			svg.setAttribute("width", imageW);
			svg.setAttribute("height", h);
			makeDraggable(svg);
			break;

		default:
			bg.setAttribute("x", 0);
			bg.setAttribute("y", 0);
			bg.setAttribute("width", w);
			bg.setAttribute("height", h);

			svg.setAttribute("viewBox", "0 0 " + w + " " + h);

			svg.setAttribute("width", w);
			svg.setAttribute("height", h);
			makeDraggable(svg);
	}
}

function prepareCrop(clickArray) {
	var startX = clickArray[0],
		startY = clickArray[1],
		endX = clickArray[2],
		endY = clickArray[3];

	if (startX > endX && startY > endY) {
		clickArray[0] = endX;
		clickArray[1] = endY;
		clickArray[2] = startX;
		clickArray[3] = startY;
	} else if (startX > endX || startY > endY) {
		if (startX > endX) {
			clickArray[0] = startX - (startX - endX);
			clickArray[2] = endX + (startX - endX);
		} else {
			clickArray[1] = startY - (startY - endY);
			clickArray[3] = endY + (startY - endY);
		}
	}
	return clickArray;
}

function setScaleboxCorners(northDegree, sunDegree) {
	if (!isNaN(northDegree) && northDegree !== 0) {
		let childList = northImage.childNodes;
		let offset90 = Math.round(northDegree / 90);
		let offset45 = northDegree / 45;

		for (index in childList) {
			if (
				childList[index].classList &&
				childList[index].classList.contains("resize") &&
				offset90 >= 1 &&
				offset90 <= 4
			) {
				if (childList[index].classList.contains("top-left")) {
					let newClass = placeEnum["top-left"] + offset90;
					if (newClass > 4) {
						newClass -= 4;
					}

					childList[index].setAttribute(
						"class",
						"resize " + getNameWithVal(newClass)
					);
				} else if (childList[index].classList.contains("top-right")) {
					let newClass = placeEnum["top-right"] + offset90;
					if (newClass > 4) {
						newClass -= 4;
					}

					childList[index].setAttribute(
						"class",
						"resize " + getNameWithVal(newClass)
					);
				} else if (
					childList[index].classList.contains("bottom-right")
				) {
					let newClass = placeEnum["bottom-right"] + offset90;
					if (newClass > 4) {
						newClass -= 4;
					}

					childList[index].setAttribute(
						"class",
						"resize " + getNameWithVal(newClass)
					);
				} else if (childList[index].classList.contains("bottom-left")) {
					let newClass = placeEnum["bottom-left"] + offset90;
					if (newClass > 4) {
						newClass -= 4;
					}

					childList[index].setAttribute(
						"class",
						"resize " + getNameWithVal(newClass)
					);
				}
			}
		}
	}
	if (!isNaN(sunDegree)) {
		let childList = sunImage.childNodes;
		let offset90 = Math.round(sunDegree / 90);

		for (index in childList) {
			if (
				childList[index].classList &&
				childList[index].classList.contains("resize") &&
				offset90 >= 1 &&
				offset90 <= 3
			) {
				if (childList[index].classList.contains("top-left")) {
					let newClass = placeEnum["top-left"] + offset90;
					if (newClass > 4) {
						newClass -= 4;
					}

					childList[index].setAttribute(
						"class",
						"resize " + getNameWithVal(newClass)
					);
				} else if (childList[index].classList.contains("top-right")) {
					let newClass = placeEnum["top-right"] + offset90;
					if (newClass > 4) {
						newClass -= 4;
					}

					childList[index].setAttribute(
						"class",
						"resize " + getNameWithVal(newClass)
					);
				} else if (
					childList[index].classList.contains("bottom-right")
				) {
					let newClass = placeEnum["bottom-right"] + offset90;
					if (newClass > 4) {
						newClass -= 4;
					}

					childList[index].setAttribute(
						"class",
						"resize " + getNameWithVal(newClass)
					);
				} else if (childList[index].classList.contains("bottom-left")) {
					let newClass = placeEnum["bottom-left"] + offset90;
					if (newClass > 4) {
						newClass -= 4;
					}

					childList[index].setAttribute(
						"class",
						"resize " + getNameWithVal(newClass)
					);
				}
			}
		}
	}
}

function setIconAngle(icon, degree) {
	if (!isNaN(degree)) {
		let transformVal = icon.getAttribute("transform");
		let transformArray = transformVal.split(" ");

		if (icon.id.indexOf("eye") > -1) {
			for (index in transformArray) {
				if (transformArray[index].indexOf("rotate") > -1) {
					var tmp = transformArray[index].split("rotate(")[1];

					tmp = tmp.replace(")", " ").trim();
					tmp = degree;
					transformArray[index] = "rotate(" + tmp + ",75,55)";

					icon.setAttribute("transform", transformArray.join(" "));
					return;
				}
			}
		} else {
			for (index in transformArray) {
				if (transformArray[index].indexOf("rotate") > -1) {
					var tmp = transformArray[index].split("rotate(")[1];

					tmp = tmp.replace(")", " ").trim();
					tmp = degree;
					transformArray[index] = "rotate(" + tmp + ")";

					icon.setAttribute("transform", transformArray.join(" "));
					return;
				}
			}
		}
	}
}

function adjustBox() {
	startX = clickArray[0];
	startY = clickArray[1];

	let w = Number(mouseX) - startX;
	let h = Number(mouseY) - startY;

	if (w !== NaN && h !== NaN) {
		if (w < 0 && h < 0) {
			h = Math.abs(h);
			w = Math.abs(w);

			outlineBox.setAttribute("x", startX - w);
			outlineBox.setAttribute("y", startY - h);
			outlineBox.setAttribute("width", w);
			outlineBox.setAttribute("height", h);
		} else if (w < 0 || h < 0) {
			if (w < 0) {
				w = Math.abs(w);

				outlineBox.setAttribute("x", startX - w);
				outlineBox.setAttribute("y", startY);
			} else {
				h = Math.abs(h);
				outlineBox.setAttribute("x", startX);
				outlineBox.setAttribute("y", startY - h);
			}
			outlineBox.setAttribute("width", w);
			outlineBox.setAttribute("height", h);
		} else {
			outlineBox.setAttribute("width", w);
			outlineBox.setAttribute("height", h);
		}
	}
}

function captureClick(x, y) {
	clickArray.push(x);
	clickArray.push(y);
}

function createTimer() {
	let startTime = new Date();

	return [
		startTime.getHours(),
		startTime.getMinutes(),
		startTime.getSeconds()
	];
}

function getCookie(cname) {
	var name = cname + "=";
	var decodedCookie = decodeURIComponent(document.cookie);
	var cookieArr = decodedCookie.split(";");
	for (var i = 0; i < cookieArr.length; i++) {
		var cookie = cookieArr[i];
		while (cookie.charAt(0) == " ") {
			cookie = cookie.substring(1);
		}
		if (cookie.indexOf(name) == 0) {
			return cookie.substring(name.length, cookie.length);
		}
	}
	return "";
}

function peekTimer(startTime) {
	let endTime = new Date(),
		hrs = parseFloat(endTime.getHours()) - parseFloat(startTime[0]),
		mins = parseFloat(endTime.getMinutes()) - parseFloat(startTime[1]),
		secs = parseFloat(endTime.getSeconds()) - parseFloat(startTime[2]);

	if (secs < 0) {
		secs = 60 + secs;
		mins -= 1;
	} else if (mins < 0) {
		mins = 60 + mins;
		hrs -= 1;
	}
	return String(hrs) + ":" + String(mins) + ":" + String(secs);
}

function triggerDownload(imgURI, filename) {
	var event = new MouseEvent("click", {
		view: window,
		bubbles: false,
		cancelable: true
	});
	var a = document.createElement("a");
	a.setAttribute("download", filename);
	a.setAttribute("href", imgURI);
	a.setAttribute("target", "_blank");

	a.dispatchEvent(event);
}

/** ----------------------------- Helper Function ---------------------------------------------------- */

/** --------------------------------- Draw Functions ----------------------------------------------------- */

function resetDrawTool() {
	drawFlag = false;
	bg.className.baseVal = "";
	document.getElementById("pencilIconFlag").className = "btn btn-lg button";

	if (lineArr.length > 0 && clickArray.length > 1) {
		lineArr.pop().remove();
	}
	clickArray = [];

	setSvgClickDetection(svg, "all");
}

function svgPoint(element, x, y) {
	var pt = svg.createSVGPoint();
	pt.x = x;
	pt.y = y;

	return pt.matrixTransform(element.getScreenCTM().inverse());
}
/** --------------------------------- Draw Functions ------------------------------------------------- */

/** ------------------------------------ Jquery ------------------------------------------------- */

$(document).ready(function() {
	var dimDiv = document.getElementById("imageDimensions"),
		origH,
		origW,
		scalePX,
		scalebarLength,
		imageSrc,
		displayCube;

	let padBottom = false,
		padTop = false,
		padLeft = false,
		padRight = false;

	var highlightBoxArray = [],
		userBoxColor;

	let bottomBtn = document.getElementById("bottomPaddingBtn"),
		topBtn = document.getElementById("topPaddingBtn"),
		rightBtn = document.getElementById("rightPaddingBtn"),
		leftBtn = document.getElementById("leftPaddingBtn");

	var paddingBoxInput = document.getElementById("paddingInput");

	bg = document.getElementById("svgBackground");

	paddingBoxInput.value = "";

	var sunIconPlaced = false,
		northIconPlaced = false,
		eyeIconPlaced = false,
		doneResizing = false,
		northFlag = false,
		cropFlag = false,
		sunFlag = false,
		eyeFlag = false;

	var DOMURL = window.URL || window.webkitURL || window;

	for (let i = 0; i < dimDiv.childElementCount; i++) {
		if (dimDiv.children[i].id === "width") {
			w = parseInt(dimDiv.children[i].innerHTML);
		} else if (dimDiv.children[i].id === "height") {
			h = parseInt(dimDiv.children[i].innerHTML);
		} else if (dimDiv.children[i].id === "origH") {
			origH = parseInt(dimDiv.children[i].innerHTML);
		} else if (dimDiv.children[i].id === "origW") {
			origW = parseInt(dimDiv.children[i].innerHTML);
		} else if (dimDiv.children[i].id === "scalebarLength") {
			scalebarLength = parseInt(dimDiv.children[i].innerHTML);
		} else if (dimDiv.children[i].id === "scalebarPx") {
			scalePX = parseInt(dimDiv.children[i].innerHTML);
		} else if (dimDiv.children[i].id === "imageSrc") {
			imageSrc = dimDiv.children[i].innerHTML;
		} else if (dimDiv.children[i].id === "isMapProjected") {
			isMapProjected = dimDiv.children[i].innerHTML;
		} else if (dimDiv.children[i].id === "scalebarUnits") {
			scalebarUnits = dimDiv.children[i].innerHTML;
		} else if (dimDiv.children[i].id === "displayCube") {
			displayCube = dimDiv.children[i].innerHTML;
		}
	}

	var sunObjectString =
		'<g id="sunPosition" class="draggable confine" transform-origin="50%; 50%;"' +
		'transform="translate(100,150) rotate(0) scale(.15625)"  stroke-width="7" style="border:0;' +
		'padding:0; pointer-events:visible;"> ' +
		'<circle id= "sunIconOuter"  r="125" cy="175" cx="150" stroke-width="15" stroke="white" fill="black"' +
		'style="border:0;"></circle>' +
		'<circle id= "sunIcon"  r="25" cy="175" cx="150" fill="white" stroke="black" style="border:0;"/>' +
		'<path d="M 150 0 L 250 50 L 150 0 L 50 50 L 150 25 L 250 50" stroke="black"' +
		'fill="white" stroke-width="10"/>' +
		'<rect class="resize top-left"x="0" y="0" width="100" height="100"' +
		'style="visibility: hidden;"fill="red"/>' +
		'<rect class="resize top-right"x="220" y="0" width="100" height="100"' +
		'style="visibility: hidden;"fill="blue"/>' +
		'<rect class="resize bottom-right"x="220" y="200" width="100"height="100" style="visibility: hidden;' +
		'"fill="green"/>' +
		'<rect class="resize bottom-left"x="0" y="200" width="100" height="100"' +
		'style="visibility: hidden;"fill="yellow"/></g>';

	var northObjectString =
		'<g id="northPosition" class="draggable confine" transform-origin="50%; 50%;"' +
		'transform="translate(100,100) rotate(0) scale(.1219513)" stroke-width="7"' +
		'style="border:0; padding:0; pointer-events:all;">' +
		'<rect x="0" y="0" id="northBG"style="visibility: visible;"width="200" height="400" fill="black"/>' +
		'<rect x="0" y="0" class="resize top-left" style="visibility: hidden;"' +
		'width="100" height="125" fill="red"/>' +
		'<rect x="100" y="0" class="resize top-right" style="visibility: hidden;"width="100" height="150"' +
		'fill="yellow"/>' +
		'<path id= "northIcon"  d="M 100 0 L 200 200 L 100 150 L 0 200 Z" fill="white"  stroke="black"' +
		'stroke-width="4" style="border:0;"></path>' +
		'<path id="nLetter" d="M 50 200 L 50 0 L 150 200 L 150 0"stroke="white" stroke-width="10"' +
		'transform="translate(0,200)"fill="black" style="border:0;"></path>' +
		'<rect class= "resize bottom-right"x="100" y="300" width="110" height="110"' +
		'style="visibility: hidden;"fill="green"/>' +
		'<rect class= "resize bottom-left"x="0" y="300" width="110" height="110" style="visibility: hidden;"' +
		'fill="blue"/></g>';

	var outlineObjectString =
		'<rect id="cropOutline" x="0" y="0" width="5" height="5"' +
		'style="fill:rgba(245, 13, 13, 0.15);pointer-events:none; stroke-width:2;stroke:rgb(255,0,0);" />';

	var attensionBoxObjectString =
		'<rect id="attensionBox" x="0" y="0" width="400" height="400"/>' +
		'<rect class=" resize top-left" x="0" y="0" width="100" height="100"' +
		'style="visibility: hidden;fill:rgba(245, 13, 13, 0.15); stroke:blue" />' +
		'<rect class=" resize top-right" x="300" y="0" width="100" height="100"' +
		'style="visibility: hidden;fill:rgba(245, 13, 13, 0.15); stroke:blue" />' +
		'<rect class=" resize bottom-right" x="300" y="300" width="100" height="100"' +
		'style="visibility: hidden;fill:rgba(245, 13, 13, 0.15); stroke:blue" />' +
		'<rect class=" resize bottom-left" x="0" y="300" width="100" height="100"' +
		'style="visibility: hidden;fill:rgba(245, 13, 13, 0.15);stroke:blue" />';

	var eyeObjectString =
		'<g id="eyePosition" class="draggable confine" transform-origin="50%; 50%;"' +
		'transform="translate(0,100) rotate(0) scale(.52)" stroke-width="3" style="border:0; padding:0;' +
		'pointer-events:visible;">' +
		'<path id="eyeArrow"x="0" y="0" transform="translate(0,0) rotate(0,150,115)"  stroke-width="2"' +
		'd="M 76.5 0 L 55 21.6 L 73.5 21.6 L 73.5 65 L78.5 65 L 78.5 21.6  L 95 21.6 L 74.5 0" ' +
		'stroke="white" fill="black"/>' +
		'<ellipse id= "eyeIconOuter"  cx="75" cy="55" rx="37" ry="25"  stroke="white" fill="black"' +
		'style="border:0;"></ellipse>' +
		'<ellipse id= "eyeIconCenter" rx="18" ry="20" cy="55" cx="75" stroke-width="3" fill="white"' +
		'stroke="black"  style="border:0;">' +
		'</ellipse><circle id= "eyeIconPupel"  r="7"cy="55" cx="75" stroke-width="4" stroke="white"' +
		'fill="black"  style="border:0;"></circle>' +
		'<rect x="0" y="0" class="resize top-left" style="visibility: hidden;"width="55" height="50"' +
		'fill="red"/>' +
		'<rect x="88" y="0" class="resize top-right" style="visibility: hidden;"width="47"' +
		'height="45" fill="blue"/>' +
		'<rect x="88" y="67" class="resize bottom-right" style="visibility:hidden;"width="47"' +
		'height="40" fill="green"/>' +
		'<rect x="1" y="65" class="resize bottom-left" style="visibility: hidden;"width="55" height="40"' +
		'fill="yellow"/></g>';

	var scaleBarObject =
		'<g id="scalebarPosition"class="draggable confine scalebar"' +
		'transform="translate(0,175) scale(.1)" stroke-width="10"' +
		'style="border:0; padding:0; pointer-events:all;">' +
		'<rect x="0" y="0" id="scalebarBG" width="4325" height="500" style="visibility:hidden;"></rect>' +
		'<rect x="150" y="200" id="scalebarOuter" width="4000" height="300"stroke-width="20" stroke="white"' +
		'fill="black" ></rect>' +
		'<path id="scalebarLine" d="M 2150 350 L 4150 350"  stroke="white" stroke-width="50"/>' +
		'<path id="scalebarVert" d="M 2150 200 L 2150 500"  stroke="white" stroke-width="20"/>' +
		'<path id="scalebarVert10th" d="M 350 200 L 350 500"  stroke="white" stroke-width="20"/>' +
		'<path id="scalebarLine10th" d="M 150 350 L 350 350"  stroke="white" stroke-width="50"/>' +
		'<path id="scalebarVert20th" d="M 550 200 L 550 500"  stroke="white" stroke-width="20"/>' +
		'<path id="scalebarVert30th" d="M 750 200 L 750 500"  stroke="white" stroke-width="20"/>' +
		'<path id="scalebarLine30th" d="M 550 350 L 750 350"  stroke="white" stroke-width="50"/>' +
		'<path id="scalebarVert40th" d="M 950 200 L 950 500"  stroke="white" stroke-width="20"/>' +
		'<path id="scalebarVert50th" d="M 1150 200 L 1150 500"  stroke="white" stroke-width="20"/>' +
		'<path id="scalebarLine50th" d="M 950 350 L 1150 350"  stroke="white" stroke-width="50"/>' +
		'<path id="scalebarVert60th" d="M 1350 200 L 1350 500"  stroke="white" stroke-width="20"/>' +
		'<path id="scalebarVert70th" d="M 1550 200 L 1550 500"  stroke="white" stroke-width="20"/>' +
		'<path id="scalebarLine70th" d="M 1350 350 L 1550 350"  stroke="white" stroke-width="50"/>' +
		'<path id="scalebarVert80th" d="M 1750 200 L 1750 500"  stroke="white" stroke-width="20"/>' +
		'<path id="scalebarVert90th" d="M 1950 200 L 1950 500"  stroke="white" stroke-width="20"/>' +
		'<path id="scalebarLine90th" d="M 1750 350 L 1950 350"  stroke="white" stroke-width="50"/>' +
		'<text id="scalebarText" x="3975" y="150" font-family="sans-serif"' +
		'font-size="125" stroke="white"fill="white"><%=scalebarLength%><%=scalebarUnits%></text>' +
		'<text id="scalebar1" x="100" y="150" font-family="sans-serif"' +
		'font-size="125" stroke="white"fill="white"> <%=scalebarLength%></text>' +
		'<text id="scalebarHalf" x="1100" y="150" font-family="sans-serif" font-size="125"' +
		'stroke="white"fill="white"></text>' +
		'<text id="scalebar0" x="2125" y="150" font-family="sans-serif" font-size="125"' +
		'stroke="white"fill="white">0</text></g>';

	var exportBtn = document.getElementById("exportBtn"),
		myImage = document.getElementById("crop");

	var line, userLineColor;

	svg = document.getElementById("svgWrapper");
	loader = document.getElementById("loading");

	myImage.setAttribute("x", parseInt(w) * 1.5 + "px");
	myImage.setAttribute("y", parseInt(h) * 1.25 + "px");

	svg.insertAdjacentHTML("beforeend", sunObjectString);
	svg.insertAdjacentHTML("beforeend", northObjectString);
	svg.insertAdjacentHTML("beforeend", outlineObjectString);
	svg.insertAdjacentHTML("beforeend", eyeObjectString);
	svg.insertAdjacentHTML("beforeend", scaleBarObject);

	(sunImage = document.getElementById("sunPosition")),
		(northImage = document.getElementById("northPosition")),
		(outlineBox = document.getElementById("cropOutline")),
		(eyeImage = document.getElementById("eyePosition")),
		(eyeArrow = document.getElementById("eyeArrow")),
		(scaleBarIcon = document.getElementById("scalebarPosition")),
		(bg = document.getElementById("svgBackground"));

	let half = parseFloat(scalebarLength) / 2;

	makeDraggable(svg);

	loadImageAsURL(imageSrc, function(data) {
		myImage.setAttributeNS(
			"http://www.w3.org/1999/xlink",
			"xlink:href",
			""
		);
		myImage.setAttributeNS(
			"http://www.w3.org/1999/xlink",
			"xlink:href",
			data
		);

		myImage.setAttribute("x", "0");
		myImage.setAttribute("y", "0");
		myImage.setAttribute("transform", "scale(1)");
	});

	if (scalePX !== "none" && !isNaN(scalePX)) {
		if (w / origW < h / origH) {
			scaleBarIcon.setAttribute(
				"transform",
				"translate(0,175) scale(" +
					(scalePX / 4000) * 2 * (w / origW) +
					")"
			);
			textSize = (scalePX / 4000) * 21 * (w / origW);
		} else {
			scaleBarIcon.setAttribute(
				"transform",
				"translate(0,175) scale(" +
					(scalePX / 4000) * 2 * (h / origH) +
					")"
			);
			textSize = (scalePX / 4000) * 21 * (h / origH);
		}

		if (half < 1) {
			document.getElementById("scalebarHalf").innerHTML = half;
		} else {
			document.getElementById("scalebarHalf").innerHTML = parseInt(half);
		}

		document.getElementById("scalebarText").innerHTML =
			scalebarLength + scalebarUnits;
		document.getElementById("scalebar1").innerHTML = scalebarLength;
	} else {
		document
			.getElementById("scaleBarButton")
			.setAttribute("class", "btn btn-secondary btn-lg button disabled");
		textSize = 2;
	}

	northImage.remove();
	sunImage.remove();
	outlineBox.remove();
	eyeImage.remove();
	scaleBarIcon.remove();

	outlineBox.style.visibility = "hidden";

	console.log(" Image Dimensions are => " + w + " : " + h);
	loadInvisible();

	document.getElementById("imageName").innerHTML = displayCube;

	getMetadata();

	/** ------------------------------- 导出方程 ------------------------------------------------- */

	exportBtn.addEventListener("click", function(event) {
		event.preventDefault();

		do {
			var filename = prompt(
				"请输入文件名及其后缀(.png/.svg) ex: test.png",
				""
			);
		} while (filename !== "" && filename !== null && !/^.*\.(png|PNG|SVG|svg)$/gm.test(filename));

		if (filename !== null) {
			var fileExt = filename.split(".")[filename.split(".").length - 1];

			var data = new XMLSerializer().serializeToString(svg);

			var svgBlob = new Blob([data], {
				type: "image/svg+xml;charset=utf-8"
			});
			var url = DOMURL.createObjectURL(svgBlob);

			if (fileExt === "svg") {
				growProgress(0.25);
				triggerDownload(url, filename);
				loader.style.visibility = "hidden";
				document.getElementById("loadingText").innerHTML = "Loading";
				setTimeout(hideProgress, 500);
				return;
			} else {
				growProgress(0.5);

				var fd = new FormData();
				fd.append("upl", svgBlob, getCookie("userId") + ".svg");
				fd.append("w", w);
				fd.append("h", h);
				fd.append("downloadName", filename);

				fetch("/figureDownload", {
					method: "POST",
					body: fd
				})
					.then(response => {
						if (response.status !== 200) {
							response.text().then(responseText => {
								let div = document.createElement("div");
								div.className =
									"jumbotron text-center float-center";
								div.style.width = "25rem";
								div.style.height = "auto";
								div.innerHTML = responseText;
								var btn = document.createElement("button");
								btn.className = "btn btn-danger";
								btn.style.position = "relative";
								btn.innerHTML = "&times;";
								btn.style.width = "5rem";
								div.appendChild(btn);
								btn.addEventListener("click", function(event) {
									this.parentElement.remove();
								});
								document.body.appendChild(div);
								loader.style.visibility = "hidden";
								document.getElementById(
									"loadingText"
								).innerHTML = "Loading";
								hideProgress();
							});
						} else {
							console.log("GOOD RESPONSE: IMAGE SHOULD DOWNLOAD");
							response.blob().then(blob => {
								console.log(blob);
								url = DOMURL.createObjectURL(blob);

								triggerDownload(url, filename);
								loader.style.visibility = "hidden";
								document.getElementById(
									"loadingText"
								).innerHTML = "Loading";
								setInterval(hideProgress, 500);
							});
						}
					})
					.catch(err => {
						if (err) {
							console.log(err);
						}
					});
			}
		} else {
			hideProgress();
			loader.style.visibility = "hidden";
			document.getElementById("loadingText").innerHTML = "Loading";
		}
	});

	$("#exportBtn").on("mousedown", function() {
		loader.style.visibility = "visible";
		document.getElementById("loadingText").innerHTML = "Compressing Image";
		showProgress();
	});

	/** --------------------------------- 导出方程 ------------------------------------------- */

	$("#northCheckbox").on("change", function() {
		let children = northImage.childNodes;

		for (index in children) {
			if (typeof children[index] == "object") {
				if (children[index].getAttribute("stroke")) {
					children[index].setAttribute(
						"stroke",
						setOpposite(children[index].getAttribute("stroke"))
					);
				}
				if (children[index].getAttribute("fill")) {
					children[index].setAttribute(
						"fill",
						setOpposite(children[index].getAttribute("fill"))
					);
				}
			}
		}
	});

	$("#sunCheckbox").on("change", function() {
		let children = sunImage.childNodes;

		for (index in children) {
			if (
				typeof children[index] == "object" &&
				children[index].nodeName !== "#text"
			) {
				if (children[index].getAttribute("stroke")) {
					children[index].setAttribute(
						"stroke",
						setOpposite(children[index].getAttribute("stroke"))
					);
				}
				if (children[index].getAttribute("fill")) {
					children[index].setAttribute(
						"fill",
						setOpposite(children[index].getAttribute("fill"))
					);
				}
			}
		}
	});

	$("#scaleCheckbox").on("change", function() {
		var children = scaleBarIcon.childNodes;

		for (index in children) {
			if (typeof children[index] == "object") {
				if (children[index].getAttribute("stroke")) {
					children[index].setAttribute(
						"stroke",
						setOpposite(children[index].getAttribute("stroke"))
					);
				}
				if (children[index].getAttribute("fill")) {
					children[index].setAttribute(
						"fill",
						setOpposite(children[index].getAttribute("fill"))
					);
				}
			}
		}
	});

	$("#eyeCheckbox").on("change", function() {
		let children = eyeImage.childNodes;

		for (index in children) {
			if (typeof children[index] == "object") {
				if (children[index].getAttribute("stroke")) {
					children[index].setAttribute(
						"stroke",
						setOpposite(children[index].getAttribute("stroke"))
					);
				}
				if (children[index].getAttribute("fill")) {
					children[index].setAttribute(
						"fill",
						setOpposite(children[index].getAttribute("fill"))
					);
				}
			}
		}
	});

	$("#colorPickerLine").change(function() {
		userLineColor = document.getElementById("colorPickerLine").value;
	});

	$("#colorPickerBox").change(function() {
		userBoxColor = document.getElementById("colorPickerBox").value;
	});

	$("#textColorPicker").on("change", function() {
		userTextColor = document.getElementById("textColorPicker").value;
	});

	// -------------------------------- Undo Button UI ------------------------------------------------------

	$("#undoLine").on("mousedown", function() {
		if (lineArr.length > 0 && clickArray.length > 1) {
			lineArr.pop().remove();
			svg.className.baseVal = "image-image float-center";
			document.getElementById("pencilIconFlag").className =
				"btn btn-lg button";
			drawFlag = false;
			clickArray = [];
		} else if (lineArr.length > 0) {
			lineArr.pop().remove();
		} else {
			alert("No lines drawn");
		}

		if (lineArr.length === 0) {
			document.getElementById("undoLine").style.visibility = "hidden";
		}
	});

	$(document).keyup(function(event) {
		if (event.keyCode === 27 && drawFlag) {
			if (lineArr.length > 0 && clickArray.length > 1) {
				lineArr.pop().remove();
				clickArray = [];
			}
		}
	});

	$("#undoBox").on("mousedown", function() {
		if (highlightBoxArray.length > 0) {
			highlightBoxArray.pop().remove();
		} else {
			alert("There are no boxes placed yet");
		}
		if (highlightBoxArray.length === 0) {
			document.getElementById("undoBox").style.visibility = "hidden";
		}
	});

	$("#undoText").on("mousedown", function() {
		if (textBoxArray.length > 0) {
			textBoxArray.pop().remove();
		} else {
			alert("text has not been added");
		}
		if (textBoxArray.length === 0) {
			document.getElementById("undoText").style.visibility = "hidden";
		}
	});

	// -------------------------------- End Undo Button UI --------------------------------------------------

	// ------------------------------- Button处理 ------------------------------------------------------

	$("#scaleBarButton").on("mousedown", function() {
		if (!this.classList.contains("disabled")) {
			if (drawFlag) {
				resetDrawTool();
			}

			if (toggleScalebar) {
				svg.appendChild(scaleBarIcon);
				this.className = "btn btn-danger btn-lg button";

				document.getElementById("scaleCheckbox").style.visibility =
					"visible";
				document.getElementById("scaleCheckboxLabel").style.visibility =
					"visible";

				toggleScalebar = false;
			} else {
				scaleBarIcon.remove();
				toggleScalebar = true;
				this.className = "btn btn-lg button";
				document.getElementById("scaleCheckbox").style.visibility =
					"hidden";
				document.getElementById("scaleCheckboxLabel").style.visibility =
					"hidden";
			}
		}
	});

	$("#textBtn").on("mousedown", function() {
		if (drawFlag) {
			resetDrawTool();
		}

		var textboxVal = prompt("What Should It Say?", "");

		if (textboxVal !== "" && textboxVal) {
			let strlength = textboxVal.length;

			var text = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"text"
			);

			var g = document.createElementNS("http://www.w3.org/2000/svg", "g");

			g.setAttribute("class", "draggable confine textbox");
			g.setAttribute("x", 0);
			g.setAttribute("y", 0);
			text.setAttribute("x", 0);
			text.setAttribute("y", 15);
			text.setAttributeNS(
				"http://www.w3.org/2000/svg",
				"letter-spacing",
				"0px"
			);
			text.style.fontSize = "15";
			g.setAttribute("height", 0);
			g.setAttribute("width", 0);
			g.setAttribute(
				"transform",
				"translate(50,50) rotate(0) scale(" + textSize * 2 + ")"
			);

			var rect = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"rect"
			);
			rect.setAttribute("x", 0);
			rect.setAttribute("y", 13);
			rect.setAttribute("width", 5);
			rect.setAttribute("height", 5);
			rect.style.visibility = "hidden";
			rect.setAttribute("class", "resize bottom-left");

			var rect2 = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"rect"
			);
			rect2.setAttribute("x", 0);
			rect2.setAttribute("y", 1);
			rect2.setAttribute("width", 5);
			rect2.setAttribute("height", 5);
			rect2.style.visibility = "hidden";
			rect2.setAttribute("class", "resize top-left");

			var rect3 = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"rect"
			);
			rect3.setAttribute("x", 10);
			rect3.setAttribute("y", 1);
			rect3.setAttribute("width", 9);
			rect3.setAttribute("height", 7);
			rect3.style.visibility = "hidden";
			rect3.setAttribute("class", "resize top-right");
			rect3.setAttribute("fill", "blue");

			var rect4 = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"rect"
			);
			rect4.setAttribute("x", 10);
			rect4.setAttribute("y", 13);
			rect4.setAttribute("width", 7);
			rect4.setAttribute("height", 7);
			rect4.setAttribute("fill", "blue");
			rect4.style.visibility = "hidden";
			rect4.setAttribute("class", "resize bottom-right");

			g.style.pointerEvents = "visible";
			text.innerHTML = textboxVal;
			g.appendChild(text);
			g.appendChild(rect);
			g.appendChild(rect2);
			g.appendChild(rect3);
			g.appendChild(rect4);

			if (userTextColor) {
				text.setAttribute("stroke", userTextColor);
				text.setAttribute("fill", userTextColor);
			} else {
				text.setAttribute("stroke", "white");
				text.setAttribute("fill", "white");
			}

			text.setAttribute("stroke-width", "1");

			svg.appendChild(g);
			let bbox = g.getBBox();

			if (strlength > 1) {
				rect3.setAttribute("x", bbox.width - 1);
				rect4.setAttribute("x", bbox.width - 1);
			}

			textBoxArray.push(g);
			if (textBoxArray.length > 0) {
				document.getElementById("undoText").style.visibility =
					"visible";
			}
			makeDraggable(svg);
		}
	});

	$("#eyeFlag").click(function() {
		if (
			!document.getElementById("eyeFlag").classList.contains("disabled")
		) {
			if (drawFlag) {
				resetDrawTool();
			}

			eyeFlag = !eyeFlag;

			if (eyeIconPlaced) {
				eyeIconPlaced = !eyeIconPlaced;
				eyeImage.remove();
				eyeImage.style.visibility = "hidden";
				eyeFlag = !eyeFlag;
				document
					.getElementById("eyeFlag")
					.setAttribute("class", "btn btn-lg button");
				document.getElementById("eyeCheckbox").style.visibility =
					"hidden";
				document.getElementById("eyeCheckboxLabel").style.visibility =
					"hidden";
			}

			if (eyeFlag) {
				cropFlag = false;

				outlineBox.remove();
				outlineBox.style.visibility = "hidden";

				svg.appendChild(eyeImage);
				setIconAngle(eyeArrow, observerDegree);
				eyeImage.style.visibility = "visible";
				document
					.getElementById("eyeFlag")
					.setAttribute("class", "btn btn-danger btn-lg button");
				document.getElementById("eyeCheckbox").style.visibility =
					"visible";
				document.getElementById("eyeCheckboxLabel").style.visibility =
					"visible";
				eyeFlag = false;
				eyeIconPlaced = true;
			}
		}
	});

	$("#sunIconFlag").click(function() {
		if (
			!document
				.getElementById("sunIconFlag")
				.classList.contains("disabled")
		) {
			if (drawFlag) {
				resetDrawTool();
			}

			sunFlag = !sunFlag;

			if (sunIconPlaced) {
				sunIconPlaced = !sunIconPlaced;
				sunImage.style.visibility = "hidden";
				sunImage.remove();
				document
					.getElementById("sunIconFlag")
					.setAttribute("class", "btn btn-lg button");
				sunFlag = false;
				document.getElementById("sunCheckbox").style.visibility =
					"hidden";
				document.getElementById("sunCheckboxLabel").style.visibility =
					"hidden";
			}

			if (sunFlag) {
				cropFlag = false;
				outlineBox.style.visibility = "hidden";

				sunImage.style.visibility = "visible";
				svg.appendChild(sunImage);
				sunFlag = false;
				sunIconPlaced = true;
				document
					.getElementById("sunIconFlag")
					.setAttribute("class", "btn btn-danger btn-lg button");
				document.getElementById("sunCheckbox").style.visibility =
					"visible";
				document.getElementById("sunCheckboxLabel").style.visibility =
					"visible";

				setIconAngle(sunImage, sunDegree);
				makeDraggable(svg);
			}
			clickArray = [];
		}
	});

	$("#northIconFlag").on("mousedown", function() {
		if (
			!document
				.getElementById("northIconFlag")
				.classList.contains("disabled")
		) {
			if (drawFlag) {
				resetDrawTool();
			}

			northFlag = !northFlag;

			if (northIconPlaced) {
				northIconPlaced = !northIconPlaced;
				northImage.remove();
				northImage.style.visibility = "hidden";
				document
					.getElementById("northIconFlag")
					.setAttribute("class", "btn btn-lg button");
				document.getElementById("northCheckbox").style.visibility =
					"hidden";
				document.getElementById("northCheckboxLabel").style.visibility =
					"hidden";

				northFlag = !northFlag;
			}

			if (northFlag) {
				outlineBox.remove();
				outlineBox.style.visibility = "hidden";

				svg.appendChild(northImage);
				northImage.style.visibility = "visible";
				setIconAngle(northImage, northDegree);
				makeDraggable(svg);
				northIconPlaced = !northIconPlaced;
				northFlag = false;
				document
					.getElementById("northIconFlag")
					.setAttribute("class", "btn btn-danger btn-lg button");
				document.getElementById("northCheckbox").style.visibility =
					"visible";
				document.getElementById("northCheckboxLabel").style.visibility =
					"visible";
			}
			clickArray = [];
		}
	});

	$("#pencilIconFlag").on("mousedown", function() {
		if (drawFlag) {
			resetDrawTool();
		} else {
			bg.className.baseVal = "draw";
			drawFlag = true;
			document.getElementById("pencilIconFlag").className =
				"btn btn-light btn-lg button";

			setSvgClickDetection(svg, "none");
		}
	});

	$("#outlineBtn").on("mousedown", function() {
		if (drawFlag) {
			resetDrawTool();
		}

		var g = document.createElementNS("http://www.w3.org/2000/svg", "g");

		g.setAttribute("class", "draggable confine outline");
		g.setAttribute("transform-origin", "50%; 50%;");
		g.setAttribute("transform", "translate(0,0) rotate(0) scale(.5)");
		g.setAttribute("stroke-width", "10");
		g.style.border = 0;
		g.style.padding = 0;
		g.style.pointerEvents = "visible";
		g.style.fill = "none";

		g.innerHTML = attensionBoxObjectString;

		if (userBoxColor) {
			g.style.stroke = userBoxColor;
		} else {
			g.style.stroke = "white";
		}
		svg.appendChild(g);
		highlightBoxArray.push(g);
		makeDraggable(svg);

		if (highlightBoxArray.length > 0) {
			document.getElementById("undoBox").style.visibility = "visible";
		}
	});

	$("#bottomPaddingBtn").on("click", function(event) {
		if (!isNaN(parseInt(paddingBoxInput.value))) {
			setImagePadding(parseInt(paddingBoxInput.value), "bottom");
			padBottom = true;
			(padLeft = false), (padRight = false), (padTop = false);

			bottomBtn.className = "btn btn-danger button btn-md disabled";

			leftBtn.className = "btn button btn-md";
			rightBtn.className = "btn button btn-md";
			topBtn.className = "btn button btn-md";
		} else {
			setImagePadding(parseInt(0), "none");
			bottomBtn.className = "btn button btn-md";
			leftBtn.className = "btn button btn-md";
			rightBtn.className = "btn button btn-md";
			topBtn.className = "btn button btn-md";
			padBottom = false;
		}
	});

	$("#topPaddingBtn").on("click", function(event) {
		if (!isNaN(parseInt(paddingBoxInput.value))) {
			setImagePadding(parseInt(paddingBoxInput.value), "top");
			padTop = true;

			(padLeft = false), (padRight = false), (padBottom = false);

			topBtn.className = "btn btn-danger button btn-md disabled";

			leftBtn.className = "btn button btn-md";
			rightBtn.className = "btn button btn-md";
			bottomBtn.className = "btn button btn-md";
		} else {
			setImagePadding(parseInt(0), "none");
			topBtn.className = "btn button btn-md";

			leftBtn.className = "btn button btn-md";
			rightBtn.className = "btn button btn-md";
			bottomBtn.className = "btn button btn-md";
			padTop = false;
		}
	});

	$("#rightPaddingBtn").on("click", function(event) {
		if (!isNaN(parseInt(paddingBoxInput.value))) {
			setImagePadding(parseInt(paddingBoxInput.value), "right");
			padRight = true;

			(padLeft = false), (padBottom = false), (padTop = false);

			rightBtn.className = "btn btn-danger button btn-md disabled";

			leftBtn.className = "btn button btn-md";
			bottomBtn.className = "btn button btn-md";
			topBtn.className = "btn button btn-md";
		} else {
			setImagePadding(parseInt(0), "none");
			rightBtn.className = "btn button btn-md";

			leftBtn.className = "btn button btn-md";
			bottomBtn.className = "btn button btn-md";
			topBtn.className = "btn button btn-md";
			padRight = false;
		}
	});

	$("#leftPaddingBtn").on("click", function(event) {
		if (!isNaN(parseInt(paddingBoxInput.value))) {
			setImagePadding(parseInt(paddingBoxInput.value), "left");
			padLeft = true;
			(padBottom = false), (padRight = false), (padTop = false);

			leftBtn.className = "btn btn-danger button btn-md disabled";

			bottomBtn.className = "btn button btn-md";
			rightBtn.className = "btn button btn-md";
			topBtn.className = "btn button btn-md";
		} else {
			setImagePadding(parseInt(0), "none");
			leftBtn.className = "btn button btn-md";
			bottomBtn.className = "btn button btn-md";
			rightBtn.className = "btn button btn-md";
			topBtn.className = "btn button btn-md";
			padLeft = false;
		}
	});

	$("#resetPaddingBtn").on("click", function(event) {
		setImagePadding(parseInt(0), "none");
		paddingBoxInput.value = "";

		(padBottom = false),
			(padLeft = false),
			(padRight = false),
			(padTop = false);

		bottomBtn.className = "btn button btn-md";
		leftBtn.className = "btn button btn-md";
		rightBtn.className = "btn button btn-md";
		topBtn.className = "btn button btn-md";
	});

	// ---------------------------------- Button处理 -----------------------------------------------

	// ---------------------------------- 文字输入 ---------------------------------------

	$("#svgWrapper").mousemove(function(event) {
		var t = event.target;
		var x = event.clientX;
		var y = event.clientY;
		var bufferY = 50;
		var target = t == svg ? svg : t.parentNode;

		var svgP = svgPoint(target, x, y);
		(mouseX = parseInt(svgP.x)), (mouseY = parseInt(svgP.y));

		if (
			drawFlag &&
			clickArray.length > 1 &&
			document.elementFromPoint(event.clientX, event.clientY) !== svg
		) {
			drawLine(line, mouseX, mouseY);
		}
	});

	$("#svgWrapper").on("click", function(event) {
		var t = event.target,
			x = event.clientX,
			y = event.clientY;

		var bufferY = parseInt(h * 0.09);

		var target = t == svg ? svg : t.parentNode;

		var svgP = svgPoint(target, x, y);
		(mouseX = parseInt(svgP.x)), (mouseY = parseInt(svgP.y));

		if (
			drawFlag &&
			clickArray.length === 0 &&
			document.elementFromPoint(event.clientX, event.clientY) !== svg
		) {
			line = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"line"
			);
			line.setAttribute("x1", mouseX);
			line.setAttribute("y1", mouseY);
			line.setAttribute("x2", mouseX);
			line.setAttribute("y2", mouseY);
			line.style.visibility = "visible";
			if (userLineColor) {
				line.style.stroke = userLineColor;
			} else {
				line.style.stroke = "white";
			}

			line.style.strokeWidth = 4;
			svg.appendChild(line);

			lineArr.push(line);
			captureClick(mouseX, mouseY);
		} else if (
			drawFlag &&
			clickArray.length > 1 &&
			document.elementFromPoint(event.clientX, event.clientY) !== svg
		) {
			line.setAttribute("x2", mouseX);
			line.setAttribute("y2", mouseY);

			clickArray = [];
			drawFlag = false;
			document.getElementById("pencilIconFlag").className =
				"btn btn-lg button";

			if (lineArr.length > 0) {
				document.getElementById("undoLine").style.visibility =
					"visible";
			}

			bg.className.baseVal = "";

			setSvgClickDetection(svg, "all");
		}
	});

	let warned = false;

	$("#paddingInput").keyup(function() {
		if (!isNaN(parseInt(this.value))) {
			if (padBottom) {
				setImagePadding(parseInt(this.value), "bottom");
			} else if (padRight) {
				setImagePadding(parseInt(this.value), "right");
			} else if (padLeft) {
				setImagePadding(parseInt(this.value), "left");
			} else if (padTop) {
				setImagePadding(parseInt(this.value), "top");
			}
		} else {
			if (this.value !== "" && !warned) {
				alert("Only Accepts Whole Numbers");
				warned = true;
			}
			$("#resetPaddingBtn").click();
		}
	});

	// ---------------------------------- 文字输入 -----------------------------------
}); /** ------------------------------------ End Jquery------------------------------------------ */
