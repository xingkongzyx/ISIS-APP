var spawn = require("child_process").spawn;
var path = require("path");
var Promises = require("bluebird");

// 导出方程
module.exports = {
	// 使用promise调用isis命令
	makeSystemCalls: function(cubeName, filepath, returnPath, imagePath) {
		return new Promise(function(resolve, reject) {
			let promises = [];

			promises.push(callIsis(cubeName, filepath, returnPath, imagePath));

			Promises.all(promises)
				.then(function() {
					console.log("isis方程调用成功\n");
					resolve();
				})
				.catch(function(code) {
					if (code === -1) {
						console.log("ISIS环境没有运行\n");
						reject(-1);
					} else {
						console.log("图片提取失败！\n");
						reject();
					}
				});
		});
	},

	// 读取pvl文件中的数据
	readPvltoStruct: function(cubeName) {
		return new Promise(function(resolve) {
			var promises = [];

			promises.push(
				processFile(
					path.join("./public/pvl/", cubeName.replace(".cub", ".pvl"))
				)
			);

			Promise.all(promises).then(function(cubeData) {
				resolve(cubeData);
			});
		});
	},

	// 提取图片比例的比例并返回
	getPixelResolution: function(cubeObj) {
		let jsonData = JSON.parse(cubeObj.data);

		let resolution = jsonData["IsisCube.Mapping.PixelResolution"];

		if (resolution === undefined) {
			resolution = jsonData["GroundPoint.ObliquePixelResolution"];
		}

		if (resolution !== undefined) {
			return resolution;
		} else {
			return -1;
		}
	},

	// 尝试以像素为单位计算图像的宽度
	calculateWidth: function(resStr, w) {
		let resFloat = parseFloat(resStr);
		if (resFloat) {
			return resFloat * w;
		} else {
			return -1;
		}
	},

	// 使用[a-z，A-Z，0-9]中元素产生给定长度的随机用户ID
	createUserID: function(lengthOfID) {
		let charString =
			"1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYXYZ";
		let idArr = [],
			charSetLength = charString.length;

		for (i = lengthOfID; i > 0; i--) {
			let char = Math.floor(Math.random() * charSetLength);
			idArr.push(charString.charAt(char));
		}
		return idArr.join("");
	},

	// 将tiff转换为多维数据集以供以后处理
	tiffToCube: function(tiffName) {
		return new Promise(function(resolve, reject) {
			var isisCall = "std2isis";

			var cubeName = tiffName.replace(".tif", ".cub");

			console.log("启动 std2isis\n");
			var std2isis = spawn(isisCall, [
				"from=",
				tiffName,
				"to=",
				cubeName
			]);

			std2isis.stdout.on("data", function(data) {});

			std2isis.stderr.on("data", function(data) {});

			std2isis.on("exit", function(code) {
				console.log(isisCall + " Exited with code: " + code + "\n");

				if (code === 0) {
					console.log("std2isis成功完成 \n");
					resolve(cubeName);
				} else {
					reject(isisCall + "Error: " + code.toString() + "\n");
				}
			});

			std2isis.on("error", function(err) {
				console.log("std2isis Failed: -1\n");
				reject(-1);
			});
		});
	},

	// 使用isis3 reduce函数缩小cube文件的大小
	reduceCube: function(cubeName, scaleFactor) {
		return new Promise(function(resolve, reject) {
			var isisCall = "reduce";
			var from = path.join(".", "uploads", cubeName);
			var to = path.join(".", "uploads", cubeName.replace("u-", "r-"));

			var reduceCall = spawn(isisCall, [
				"from=",
				from,
				"to=",
				to,
				"sscale=",
				scaleFactor,
				"lscale=",
				scaleFactor
			]);

			reduceCall.stderr.on("data", function(data) {
				console.log(isisCall + " Error: " + data.toString() + "\n");
			});

			reduceCall.stdout.on("data", function(data) {
				console.log(isisCall + " stdout: " + data.toString() + "\n");
			});

			reduceCall.on("exit", function(code) {
				console.log(isisCall + " Exited with code: " + code + "\n");

				if (code === 0) {
					resolve(cubeName.replace("u-", "r-"));
				} else {
					reject(isisCall + "Error: " + code.toString() + "\n");
				}
			});

			reduceCall.on("error", function(err) {
				console.log("std2isis Failed: -1\n");
				reject(-1);
			});
		});
	},

	getRawCube: function(cubeName, userNum) {
		if (cubeName.indexOf("u-" + userNum) > -1) {
			return cubeName.split("u-" + userNum)[1];
		} else {
			return cubeName.split("r-" + userNum)[1];
		}
	},

	// 查找地图投影组或映射组
	isMapProjected: function(cubeData) {
		var data = JSON.parse(cubeData);

		for (key in data) {
			if (key === "IMAGE_MAP_PROJECTION" || key.indexOf("Mapping") > -1) {
				return true;
			}
		}
		return false;
	},

	// 根据图像是否旋转来查找向北箭头的偏移量
	getRotationOffset: function(isProjected, cubeData) {
		if (isProjected) {
			let data = JSON.parse(cubeData);

			for (key in data) {
				if (key.indexOf("MAP_PROJECTION_ROTATION") > -1) {
					return parseFloat(data[key]);
				}
			}
		}

		return 0;
	},

	// 此函数用于在图像文件夹中创建cube图像的路径
	findImageLocation: function(cookieval) {
		return path.join("images", cookieval.replace(".cub", ".png"));
	},

	// 计算新图像的高度和宽度，并存储x，y坐标（索引0和1）以及裁剪的高度和宽度用于jimp函数（索引2和3）
	calculateCrop: function(cropArray) {
		let start_x = Number(cropArray[0]);
		let start_y = Number(cropArray[1]);

		let width = Number(cropArray[2]) - start_x;
		let heigth = Number(cropArray[3]) - start_y;

		cropArray[2] = width;
		cropArray[3] = heigth;

		return cropArray;
	},

	// 扫描数组并添加元素（如果元素尚不存在）
	addCubeToArray: function(cubeObj, cubeArray) {
		if (cubeArray.length === 0) {
			cubeArray.push(cubeObj);
			return cubeArray;
		} else {
			for (var index = 0; index < cubeArray.length; index++) {
				if (cubeObj.userId === cubeArray[index].userId) {
					return cubeArray;
				}
			}
			cubeArray.push(cubeObj);
			return cubeArray;
		}
	},

	// 检索正在搜索的对象；如果数组为空，则返回0；如果未找到，则返回 -1
	getObjectFromArray: function(userId, cubeArray) {
		if (cubeArray.length === 0) {
			return 0;
		} else {
			for (var index = 0; index < cubeArray.length; index++) {
				if (userId === cubeArray[index].userId) {
					return cubeArray[index];
				}
			}
			return -1;
		}
	},

	// 将数据从JSON字符串转换为csv字符串
	getCSV: function(cubeData) {
		cubeData = JSON.parse(cubeData);
		let csvString = "";

		for (key in cubeData) {
			csvString += key + "," + '"' + cubeData[key] + '"' + "\n";
		}
		return csvString;
	},

	// 返回cfg文件中数组
	configServer: function(cfgString) {
		let tags = cfgString.split("\n");
		var importantTags = [];
		for (var i = 0; i < tags.length; i++) {
			if (tags[i].indexOf("<tag>") > -1) {
				importantTags.push(
					tags[i]
						.replace("<tag>", "")
						.replace("</tag>", "")
						.trim()
				);
			}
		}
		return importantTags;
	},

	// 从 important tag array中提取数据
	importantData: function(cubeFileData, importantTagArr) {
		cubeFileData = JSON.parse(cubeFileData);
		var impJSON = {};
		for (tag in importantTagArr) {
			for (key in cubeFileData) {
				if (key.indexOf(importantTagArr[tag]) > -1) {
					impJSON[importantTagArr[tag]] = cubeFileData[key];
					break;
				} else {
					impJSON[importantTagArr[tag]] = "None";
				}
			}
		}
		return JSON.stringify(impJSON);
	},

	base64_encode: function(file) {
		var fs = require("fs");
		var bitmap = fs.readFileSync(file);
		return Buffer.from(bitmap).toString("base64");
	},

	// 使用数据string并写入文件
	base64_decode: function(base64str, file) {
		var fs = require("fs");
		var bitmap = Buffer.from(base64str, "base64");
		fs.writeFileSync(file, bitmap);
		console.log("******** 通过base64编码字符串构建文件 ********");
	},

	getimagename: function(cubeName, format) {
		let namearr = cubeName.toString().split(".");
		namearr[namearr.length - 1] = format;
		return namearr.join(".");
	},

	parseQuery: function(imageName) {
		try {
			return imageName.split("?")[0];
		} catch (err) {
			return imageName;
		}
	}
};

// -------------------------------------- helper方程 ---------------------------------------------------

var testHeader = function(testValue) {
	let variablearray = ["Object", "Group"];
	for (var i = 0; i < variablearray.length; i++) {
		if (variablearray[i] == testValue.trim()) {
			return true;
		}
	}
	return false;
};

var combineName = function(name, str = undefined) {
	if (str == undefined) {
		return name.toString().trim();
	} else if (name == "") {
		return str.replace(":", "-");
	} else {
		return name.toString().trim() + "." + str.replace(":", "-").trim();
	}
};

// 移除最后添加的元素
var shortenName = function(name) {
	var strarr = name
		.toString()
		.trim()
		.split(".");

	if (strarr.length > 1) {
		strarr.pop();
		return strarr.join(".");
	} else {
		return "";
	}
};

// 产生正确的pvl文件
var callIsis = function(cubeName, filepath, returnPath, imagePath) {
	return new Promise(function(resolve, reject) {
		var isisCalls = ["campt", "catlab", "catoriglab"];
		var promises = [];

		var imagename = require(__filename).getimagename(cubeName, "png");

		for (var i = 0; i < isisCalls.length; i++) {
			console.log(isisCalls[i] + " 现在开始\n");
			promises.push(makeIsisCall(filepath, returnPath, isisCalls[i]));
		}
		promises.push(imageExtraction(imagename, filepath, imagePath));

		Promises.all(promises)
			.then(function() {
				resolve();
			})
			.catch(function(code) {
				if (code === -1) {
					reject(code);
				} else {
					reject();
				}
			});
	});
};

// 调取isis文件处理命令
var imageExtraction = function(imagename, filepath, imagePath) {
	console.log("使用 isis2std 调用图片 \n");
	return new Promise(function(resolve, reject) {
		var isis2std = spawn("isis2std", [
			"from=",
			filepath,
			"to=",
			path.join(imagePath, imagename)
		]);

		isis2std.stdout.on("data", function(data) {});

		isis2std.stderr.on("data", function(data) {});

		isis2std.on("exit", function(code) {
			if (code === 0) {
				resolve();
			} else {
				reject("isis2std Error: " + code.toString + "\n");
			}
		});

		isis2std.on("error", function(err) {
			reject(-1);
		});
	});
};

// 调取isis命令行
var makeIsisCall = function(filepath, returnPath, isisCall) {
	return new Promise(function(resolve, reject) {
		var isisSpawn = spawn(isisCall, [
			"from=",
			filepath,
			"to=",
			returnPath,
			"append=",
			"true"
		]);

		isisSpawn.stdout.on("data", function(data) {});

		isisSpawn.stderr.on("data", function(data) {});

		isisSpawn.on("exit", function(code) {
			resolve();
		});

		isisSpawn.on("error", function(code) {
			console.log(isisCall + " Failed: -1\n");
			reject(-1);
		});
	});
};

// 决定本行是否结束
var endTag = function(nameString) {
	let arr = ["End_Object", "End_Group"];

	for (let i = 0; i < arr.length; i++) {
		if (nameString == arr[i]) {
			return true;
		}
	}
	return false;
};

// 读取文件并以json形式输出
var processFile = function(inputFile) {
	return new Promise(function(resolve) {
		var fs = require("fs"),
			readline = require("readline"),
			instream = fs.createReadStream(inputFile),
			outstream = new (require("stream"))(),
			rl = readline.createInterface(instream, outstream);

		var cubeData = {};
		var tagName = "";
		var lastTag = "";

		rl.on("line", function(line) {
			let val = "";

			if (
				testHeader(
					line
						.toString()
						.trim()
						.split("=")[0]
				)
			) {
				if (tagName == "") {
					tagName = combineName(
						line
							.toString()
							.trim()
							.split("=")[1]
					);
				} else {
					tagName = combineName(
						tagName,
						line
							.toString()
							.trim()
							.split("=")[1]
							.trim()
					);
				}
			} else {
				if (endTag(line.trim())) {
					tagName = shortenName(tagName);
				} else if (
					line.trim().indexOf("/*") > -1 ||
					line.trim() == ""
				) {
				} else {
					if (
						line
							.toString()
							.trim()
							.split("=")[1] != undefined ||
						line
							.toString()
							.trim()
							.split("=")[1] == "."
					) {
						val = line
							.toString()
							.split("=")[1]
							.trim();
						let tmpTag = line
							.toString()
							.split("=")[0]
							.trim();

						tagName = combineName(tagName, tmpTag);

						cubeData[tagName] = val;
						lastTag = tagName;
						tagName = shortenName(tagName);
					} else {
						if (line.trim() != "End") {
							cubeData[lastTag] = String(cubeData[lastTag])
								.trim()
								.concat(" " + line.trim());
						} else {
							tagName = "";
						}
					}
				}
			}
		});
		rl.on("close", function(line) {
			for (key in cubeData) {
				cubeData[key] = cubeData[key]
					.replace(/\"/g, "")
					.replace(/\n/g, "");
			}
			resolve(JSON.stringify(cubeData));
		});
	});
};
