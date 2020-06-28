/** 变量 */

var outputName, loader;

let unwantedPunc = [
	".",
	",",
	"-",
	"?",
	"!",
	"%",
	"#",
	"@",
	"$",
	":",
	";",
	'"',
	"'",
	"<",
	">"
];

/** -------------------------------- 主要Functions ----------------------------------------------------- */

function filterTags() {
	let filterValue = document.getElementById("filterInput").value;
	let dataTagField =
		document.getElementById("button-more-tags").innerHTML === "显示全部标签"
			? document.getElementById("metadataTagArea").value
			: document.getElementById("allTagArea").value;

	let dataLines = dataTagField.split("\n");

	if (filterValue !== "" && filterValue.length >= 2) {
		var filteredArray = [];

		for (line in dataLines) {
			if (
				dataLines[line]
					.toLowerCase()
					.indexOf(filterValue.toLowerCase()) > -1
			) {
				filteredArray.push(dataLines[line]);
			}
		}
		document.getElementById("test").value = filteredArray.join("\n");
	} else {
		document.getElementById("test").value = dataTagField;
	}
}

// 将输出的值设置为模板，然后调用output（）
function setOutput() {
	let getTemplate = document.getElementById("template-text").value;
	document.getElementById("template-text-output").innerHTML = getTemplate;
	output();
}

// 解析重要标签并填充标签区域
function getMetadata() {
	var metaDataString = document.getElementById("metadata-text").value;
	var metaDataArea = document.getElementById("metadataTagArea");
	metaDataArea.value = "";
	var jsonData = JSON.parse(metaDataString);

	for (key in jsonData) {
		if (key != undefined) {
			let str = keyToTag(key) + ": " + jsonData[key] + "\n";
			metaDataArea.value += str;
		}
	}
}

// 从passedTXT中检索所有标签，并以标签格式填充所有标签区域
function getAllTags() {
	var metaData = document.getElementById("passedTXT").value;
	var metaDataArea = document.getElementById("allTagArea");
	metaDataArea.value = "";
	metaData = JSON.parse(metaData);
	for (key in metaData) {
		let str = keyToTag(key) + ": " + metaData[key].toString().trim() + "\n";
		metaDataArea.value += str;
	}
}

// 将键值转换为标签以在UI上显示
function keyToTag(key) {
	var tag = "[[ " + key + " ]]";
	return tag;
}

function removePunctuation(key) {
	for (index in unwantedPunc) {
		if (
			key[key.length - 1] === unwantedPunc[index] ||
			key[0] === unwantedPunc[index]
		) {
			return true;
		}
	}
	return false;
}

function exchangeData(keyString) {
	let Farr = [],
		Barr = [],
		key;
	for (let i = 0; i < keyString.length; i++) {
		if (unwantedPunc.includes(keyString[i])) {
			Farr.push(keyString[i]);
		} else {
			break;
		}
	}
	for (let i = keyString.length - 1; i > 0; i++) {
		if (unwantedPunc.includes(keyString[i])) {
			Barr.push(keyString[i]);
		} else {
			break;
		}
	}
	key = keyString.substring(Farr.length, keyString.length - Barr.length);
	let val = getMetadataVal(key);

	if (key !== val) {
		if (hasUnits(val)) {
			val = removeUnits(val);
		}
		return Farr.join("") + val + Barr.join("");
	} else {
		return keyString;
	}
}

function getMetadataVal(key) {
	var allMetaData = JSON.parse(document.getElementById("all-tag-text").value);
	var impData = JSON.parse(document.getElementById("metadata-text").value);

	allMetaData = Object.assign(allMetaData, impData);
	for (datakey in allMetaData) {
		if (datakey === key) {
			return allMetaData[datakey].trim();
		} else if (removePunctuation(key)) {
			return exchangeData(key);
		}
	}
	return key;
}

String.prototype.replaceAll = function(find, replace) {
	var str = this;
	return str.replace(
		new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "g"),
		replace
	);
};

// 如果数据值中有单位，则返回TRUE；如果没有，则返回FALSE
function hasUnits(str) {
	if (str.indexOf("<") > -1 && str.indexOf(">") > -1) {
		return true;
	} else {
		return false;
	}
}

// 将单位字符串从值中移除，只保留重要部分
function removeUnits(str) {
	let tmpArr = str.split(" "),
		unitsFound = false;

	for (index in tmpArr) {
		if (
			tmpArr[index].indexOf("<") > -1 ||
			(tmpArr[index].indexOf(">") > -1 && !unitsFound)
		) {
			tmpArr[index] = "";
			unitsFound = true;
		} else if (unitsFound) {
			tmpArr[index] = "";
		}
	}

	return tmpArr.join("");
}

// 将模板的输出设置为标题区域
function output() {
	var tempText = document.getElementById("template-text").value;
	console.log(
		"=================================================================="
	);
	console.log("tempText is ", tempText);
	console.log(
		"=================================================================="
	);
	var tempArr = tempText.split(" ");
	for (var i = 0; i < tempArr.length; i++) {
		tempArr[i] = getMetadataVal(tempArr[i].trim());

		if (hasUnits(tempArr[i])) {
			tempArr[i] = removeUnits(tempArr[i]);
		}
	}

	tempText = tempArr.join(" ");

	var output = (document.getElementById(
		"template-text-output"
	).innerHTML = tempText);

	var finalResult = output;
	var tpl = document.getElementById("link");
	tpl.href = "data:attachment/text," + encodeURIComponent(finalResult);
	tpl.target = "_blank";
	tpl.download = outputName;
}

function showMoreTags() {
	var val = document.getElementById("button-more-tags").innerHTML;
	var textArea = document.getElementById("test");
	var metaTags = document.getElementById("metadataTagArea");
	var importantTags = document.getElementById("allTagArea");
	val = val.toString();
	if (val === "显示重要标签") {
		val = "显示全部标签";
		document.getElementById("button-more-tags").innerHTML = val;
		textArea.value = metaTags.value;
	} else {
		val = "显示重要标签";
		document.getElementById("button-more-tags").innerHTML = val;
		textArea.value = importantTags.value;
	}

	if (document.getElementById("filterInput").value !== "") {
		filterTags();
	}
}

function loadInvisible() {
	loader.style.visibility = "hidden";
}

function loaderActivate() {
	loader.style.visibility = "visible";
}

function initTags() {
	// write default to tag section
	showMoreTags();
}
/** ----------------------------------------- 主要方程区域 ---------------------------------------- */

/** ----------------------------------------- Jquery 方程 ------------------------------------------- */
$(document).ready(function() {
	var varDiv = document.getElementById("pageVariables");
	loader = document.getElementById("loading");

	for (let i = 0; i < varDiv.childElementCount; i++) {
		if (varDiv.children[i].id === "outputName") {
			outputName = varDiv.children[i].innerHTML;
		}
	}

	$("#template-text").keyup(function() {
		setOutput();
	});

	$("#filterInput").keyup(function() {
		filterTags();
	});
});

$(window).bind("pageshow", function(event) {
	if (event.originalEvent.persisted) {
		loadInvisible();
	}

	//开启页面必须方程
	loadInvisible();
	setOutput();
	getMetadata();
	getAllTags();
	initTags();
});
/** ----------------------------------------- End Jquery 方程 --------------------------------------- */
