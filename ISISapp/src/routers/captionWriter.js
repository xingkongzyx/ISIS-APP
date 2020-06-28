const express = require("express");
const Promise = require("bluebird");
const ISISdata = require("../models/data");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
const Cube = require("../../public/js/cubeObj.js");
const ISIShelper = require("../ISIShelper.js");

// 全局变量，cubeArray用于记载所有在启动服务器时上传的文件数据
var ISISdataArr = [];
var numUsers = 0;

// 读取cfg文件夹下重要的tags
const importantTagArr = ISIShelper.configServer(
	fs.readFileSync("public/tagConfig/importantTags.cnf", {
		encoding: "utf-8"
	})
);

const router = new express.Router();

/**
 * POST '/captionWriter'
 *
 * 表格提交后的上传过程及文件处理过程
 */
router.post("/captionWriter", async function(req, res) {
	console.log(`正在使用 ${req.method}协议访问 ${req.path}`);

	// template file中的文本内容
	var templateText = "";
	let isTiff = false;

	console.log(
		chalk.bgRed("=================== 新文件上传 ========================")
	);

	// cube文件模块

	if (req.files === null || !req.files.uploadFile) {
		// 如果没有文件传入返回首页并在query中添加alertcode
		res.redirect("/?alertCode=3");
	}
	// cube (.cub) file regexp
	else if (/^.*\.(cub|CUB|tif|TIF)$/gm.test(req.files.uploadFile.name)) {
		// 是否符合上传的文件格式
		var cubeFile = req.files.uploadFile;
		var uid = req.cookies["userId"];
		var promises = [];

		// 设置tiff旗帜
		if (cubeFile.name.indexOf(".tif") !== -1) {
			isTiff = true;
		} else {
			isTiff = false;
		}

		// 没找到userid
		if (uid === undefined) {
			// 设置23位数字的随机userid
			uid = ISIShelper.createUserID(23);
			// 把userid设置为cookie，期限为一个月
			res.cookie("userId", uid, {
				expires: new Date(Date.now() + 2628100000),
				httpOnly: false
			});
		}

		// 如果cube array为空
		// cubearray = [{name: u-06352r.lev1.cub, userID, userNum}]
		if (ISISdataArr.length === 0) {
			// 创建cube obj
			var cubeObj = new Cube("u-" + numUsers + cubeFile.name, uid);
			// 记录有几个正在上传的用户
			cubeObj.userNum = numUsers++;
		} else {
			// 如果同一用户已经上传了cub文件
			for (let element of ISISdataArr) {
				if (element.userId === uid) {
					// 覆写其中的name属性
					element.name = "u-" + element.userNum + cubeFile.name;
					cubeObj = element;
					break;
				}
			}
			// 如果不是同一个用户上传文件
			if (cubeObj === undefined) {
				var cubeObj = new Cube("u-" + numUsers + cubeFile.name, uid);
				cubeObj.userNum = numUsers++;
			}
		}

		// 保存上传的cub文件到upload文件夹
		cubeFile.mv("uploads/" + cubeObj.name, function(err) {
			if (err) {
				console.log('请检查"/uploads"文件夹是否存在');
				return res.status(500).send(err);
			}
		});

		// 检查template file模块
		if (!req.files.templateFile) {
			// 如果没有上传template文件
			templateText = fs.readFileSync("public/tpl/default.tpl", "utf-8");
		} else if (/^.*\.(tpl)$/gm.test(req.files.templateFile.name)) {
			let tplFile = req.files.templateFile;

			// 保存到tpl文件夹中
			tplFile.mv("public/tpl/" + tplFile.name, function(err) {
				if (err) {
					return res.status(500).send(err);
				}
			});
			// 把template file中的内容赋予templateText
			templateText = tplFile.data.toString();
		} else {
			// 上传的文件格式不对
			res.redirect("/?alertCode=2");
		}

		// 上传文件时附带的像素设置
		if (
			Number(req.body.desiredWidth) > 50 ||
			Number(req.body.desiredHeight) > 50
		) {
			if (Number(req.body.desiredHeight) === 0) {
				// 设为负数方便接下来使用jimp处理
				cubeObj.userDim = [Number(req.body.desiredWidth), -1];
			} else if (Number(req.body.desiredWidth) === 0) {
				cubeObj.userDim = [-1, Number(req.body.desiredHeight)];
			} else {
				cubeObj.userDim = [
					Number(req.body.desiredWidth),
					Number(req.body.desiredHeight)
				];
			}
		} else {
			// 否则使用默认图像尺寸
			cubeObj.userDim = [900, 900];
		}

		// 重设isTiff标志
		isTiff = false;

		// 上传的cub文件放在upload/, tpl parse为string, 图像尺寸设置完成后
		Promise.all(promises)
			.then(async function(cubeName) {
				// 如果长度不为0则提取最新的
				if (cubeName.length > 0) {
					fs.unlinkSync(cubeName[0].replace(".cub", ".tif"));
					cubeObj.name = path.basename(cubeName[0]);
				}
				// 重设promise数组
				promises = [];
				var lines, samples, scaleFactor;

				// 获取cube文件中包含的cube初始尺寸以访需要延展
				try {
					const data = await fs.promises.readFile(
						path.join("uploads", cubeObj.name)
					);

					let bufferArray = data
						.subarray(0, data.length / 10)
						.toString()
						.split("\n");

					// 寻找cube file中samples和lines
					for (let index = 0; index < bufferArray.length; index++) {
						if (
							// indexOf()方法返回在数组中可以找到一个给定元素的第一个索引，如果不存在，则返回-1。
							bufferArray[index].indexOf("Group = Dimensions") >
							-1
						) {
							samples = Number(
								bufferArray[index + 1].split("=")[1]
							);
							lines = Number(
								bufferArray[index + 2].split("=")[1]
							);

							console.log(
								"This cube file is " +
									samples +
									" samples by " +
									lines +
									" lines"
							);
							// scaleFactor是将最低尺寸缩小到新尺寸所需的因素
							scaleFactor =
								samples <= lines
									? lines / cubeObj.userDim[1]
									: samples / cubeObj.userDim[0];
							break;
						}
					}

					if (scaleFactor > 1) {
						promises.push(
							ISIShelper.reduceCube(cubeObj.name, scaleFactor)
						);
					}
					Promise.all(promises)
						.then(function(cubeName) {
							if (cubeName.length > 0) {
								cubeObj.name = cubeName[0];
							}

							promises = [];
							//  调用isis命令行读取文件
							promises.push(
								ISIShelper.makeSystemCalls(
									cubeObj.name,
									path.join("uploads", cubeObj.name),
									path.join(
										"public/pvl",
										cubeObj.name.replace(".cub", ".pvl")
									),
									"images"
								)
							);

							// 当isis系统完成对pvl文件的读取
							Promise.all(promises)
								.then(function() {
									//重置 promises array
									promises = [];

									promises.push(
										ISIShelper.readPvltoStruct(cubeObj.name)
									);

									// 当readPvltoStructf function执行完成后,我们得到了cube 数据
									Promise.all(promises)
										.then(function(cubeData) {
											console.log(
												"PVL文件提取完成"
											);
											// 如果cube instance不存在的话将其添加进cube数组
											ISISdataArr = ISIShelper.addCubeToArray(
												cubeObj,
												ISISdataArr
											);

											// 把cube file提取出的数据保存到cube obj中
											cubeObj.data = JSON.parse(cubeData);

											// 获取重要tag的数据
											var impDataString = ISIShelper.importantData(
												cubeObj.data,
												importantTagArr
											);

											// 将重要tag的数据保存到cubeObj中
											cubeObj.impData = JSON.parse(
												impDataString
											);

											// 得到csv形式的数据
											let csvString = ISIShelper.getCSV(
												cubeObj.data
                                            );

                                            // 提取最近三次的数据并保存在数据库
                                            let imageName = ISIShelper.getimagename(cubeObj.name, "png");
                                            
                                            const imageBase64 = fs.readFileSync(path.join("images/", imageName), "base64");
                                            const DBcsvString = csvString;
                                            const DBimpString = impDataString;
                                            const dbObj = new ISISdata({csvData: DBcsvString, impData: DBimpString, imageData: imageBase64, fileName: cubeFile.name})

                                             dbObj.save(function(error) {
                                                if(error){
                                                    console.log("DB 错误!");
                                                }
                                                console.log(chalk.bgYellow("存储至数据库成功！"))                                     
                                            })

                                            ISISdata.countDocuments({}, (err,count)=>{
                                                if(count >= 2){
                                                    ISISdata.findOneAndDelete({},{"sort": { "_id": 1 }}, function(err){
                                                        if(err){
                                                            console.log("删除多余数据时失败！");
                                                        }
                                                    })
                                                }
                                            })

											let csvFilename = cubeObj.name.replace(
												".cub",
												"_数据.csv"
											);

											// 得到可能输出的文件的名字
											let txtFilename = cubeObj.name.replace(
												".cub",
												"_文本.txt"
											);

											// 将cub数据写入文件
											fs.writeFileSync(
												`public/csv/${csvFilename}`,
												csvString,
												"utf-8"
											);
											res.render("writer.ejs", {
												// 读取的tpl文件的内容
												templateText,
												// 重要的标签
												dictionaryString: impDataString,
												// 所有标签
												wholeData: cubeObj.data,
												// csv string
												csvString,
												// 输出文件名称
												outputName: txtFilename
											});
										})
										.catch(function(err) {
											console.log(
												"发生Promise相关错误: " + err
											);
											res.write(
												"<html>PROGRAMMING SYNC ERROR</html>"
											);
											res.end();
										});
								})
								.catch(function(errcode) {
									if (errcode === -1) {
										// isis没有启动时alert 8
										res.redirect("/?alertCode=8");
									} else {
										// 从cube文件创建图像失败
										res.redirect("/?alertCode=6");
									}
								});
						})
						.catch(function(err) {
							if (err === -1) {
								// // isis文件没开启时 alert 8 
								res.redirect("/?alertCode=8");
							} else {
								console.log("Reduce方程发生错误: " + err);
							}
						});
				} catch (error) {
					console.log("READING发生错误: " + err);
				}
			})
			.catch(function(err) {
				if (err === -1) {
					// isis文件没开启时 alert 8 
					res.redirect("/?alertCode=8");
				} else {
					// 转化文件失败时 alert 5 
					res.redirect("/?alertCode=5");
				}
			});
	} else {
		// 上传错误的文件
		res.redirect("/?alertCode=1");
	}
});

/**
 * GET '/captionWriter'
 *
 * 当用户输入'/captionWriter' url,且上次的数据依旧存在的话将会返回对应的数据
 *
 * 如果上传新文件必须使用 POST request
 */
router.get("/captionWriter", function(req, res) {
	console.log(`正在使用 ${req.method}协议访问 ${req.path}`);

	var userid = req.cookies["userId"];
	// 如果根本不存在userID
	if (userid === undefined) {
		res.redirect("/?alertCode=7");
	} else {
		//为用户检索最后找到的文件,否则警告会话超时，用户需要再次上传
		var userObject = ISIShelper.getObjectFromArray(userid, ISISdataArr);
		if (typeof userObject !== "number") {
			res.render("writer.ejs", {
				templateText: fs.readFileSync(
					"public/tpl/default.tpl",
					"utf-8"
				),
				dictionaryString: userObject.impData,
				wholeData: userObject.data,
				csvString: ISIShelper.getCSV(userObject.data),
				outputName: userObject.name.replace(".cub", "_文本.txt")
			});
		} else {
			// 没有找到
			res.redirect("/?alertCode=4");
		}
	}
});

module.exports = { router, ISISdataArr };
