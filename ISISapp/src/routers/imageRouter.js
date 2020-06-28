const express = require("express");
const svg2img = require("svg2img")
const fs = require("fs")

const ISIShelper = require("../ISIShelper.js");

const router = new express.Router();

const { ISISdataArr: cubeArray } = require("./csvRouter");
// 确定是否是在windows系统允许的
var isWinSystem = process.platform === "win32";


/**
 * POST '/imageEditor'
 *
 * 产生image页面
 */
router.post("/imageEditor", function (request, response) {
    console.log(`正在使用 ${request.method}协议访问 ${request.path}`)

    // 准备的变量
    var uid = request.cookies["userId"],
        userObject,
        imagepath,
        data,
        resolution;

    if (uid !== undefined) {
        // 获取用户对应的cube obj
        userObject = ISIShelper.getObjectFromArray(uid, cubeArray);

        // 获取提取的图像和对应地址
        if (typeof userObject === "object") {
            let image = ISIShelper.getimagename(userObject.name, "png");
            imagepath = "images/" + image;

            // 如果根本没找到cube file
            if (userObject < 1) {
                data = "NONE";
            } else {
                // 获取 resolution value
                var resolution = ISIShelper.getPixelResolution(userObject);
                // 除此以外获取重要的数据
                data = userObject.impData;
            }
        }
    } else {
    //   如果根本没有用户  
        imagepath = "none";
    }

    // 针对上面的问题报错
    if (imagepath === "none" || typeof userObject !== "object") {
        response.redirect("/?alertCode=4");
        return response.end();
    } else {
        var w, h;
        // 得到cube文件的尺寸
        userObject
            .getCubeDimensions()
            .then(dimensions => {
                dimensions = JSON.parse(dimensions);
                w = dimensions.w;
                h = dimensions.h;
                // 如果需要的话检查并计算用户尺寸
                if (userObject.userDim[0] === -1) {
                    let factor = userObject.userDim[1] / h;

                    userObject.userDim = [w * factor, userObject.userDim[1]];
                } else if (userObject.userDim[1] === -1) {
                    let factor = userObject.userDim[0] / w;

                    userObject.userDim = [userObject.userDim[0], h * factor];
                }

                var userDim = userObject.userDim;
                var rawCube = ISIShelper.getRawCube(
                    userObject.name,
                    userObject.userNum
                );
                // 检测是否属于map projection group 或者 Mapping group
                var isMapProjected = ISIShelper.isMapProjected(userObject.data),
                    rotationOffset = ISIShelper.getRotationOffset(
                        isMapProjected,
                        userObject.data
                    );

                // 以米为单位计算图像宽度
                if (resolution !== -1) {
                    var imageMeterWidth = ISIShelper.calculateWidth(resolution, w);

                    if (imageMeterWidth > -1) {
                        // 与上述计算比例尺的过程一致
                        let x = Math.log10(imageMeterWidth / 2);
                        let a = Math.floor(x);
                        let b = x - a;

                        if (b >= 0.75) {
                            b = 5;
                        } else if (b >= 0.35) {
                            b = 2;
                        } else if (b < 0.05) {
                            a -= 1;
                            b = 5;
                        } else {
                            b = 1;
                        }

                        var scalebarMeters = b * Math.pow(10, a);

                        var scalebarLength,
                            scalebarUnits = "";
                        // 如果长度小于1千米以米的形式返回
                        if (imageMeterWidth / 1000 < 1) {
                            scalebarLength = scalebarMeters;
                            var scalebarPx = parseInt(
                                scalebarLength / parseFloat(resolution)
                            );
                            console.log(scalebarLength + " m");
                            scalebarUnits = "m";
                        } else {
                            scalebarLength = scalebarMeters / 1000;
                            var scalebarPx = parseInt(
                                scalebarLength / (parseFloat(resolution) / 1000)
                            );
                            console.log(scalebarLength + " km");
                            scalebarUnits = "km";
                        }

                        // render html界面
                        if (isWinSystem) {
                            imagepath = imagepath.replace("\\", "/");
                        }
                        if (
                            userDim !== undefined &&
                            userDim[0] !== 0 &&
                            userDim[1] !== 0
                        ) {
                            response.render("image.ejs", {
                                image: imagepath,
                                tagField: data,
                                displayCube: rawCube,
                                isMapProjected,
                                rotationOffset,
                                origW: w,
                                origH: h,
                                w: userDim[0],
                                h: userDim[1],
                                scalebarLength,
                                scalebarPx,
                                scalebarUnits
                            });
                        } else {
                            response.render("image.ejs", {
                                image: imagepath,
                                tagField: data,
                                displayCube: rawCube,
                                isMapProjected: isMapProjected,
                                rotationOffset: rotationOffset,
                                w: w,
                                h: h,
                                origW: w,
                                origH: h,
                                scalebarLength: scalebarLength,
                                scalebarPx: scalebarPx,
                                scalebarUnits: scalebarUnits
                            });
                        }
                    } else {
                        console.log(
                            "图片宽度计算失败"
                        );
                    }
                } else {
                    if (isWinSystem) {
                        imagepath = imagepath.replace("\\", "/");
                    }
                    if (
                        userDim !== undefined &&
                        userDim[0] !== 0 &&
                        userDim[1] !== 0
                    ) {
                        response.render("image.ejs", {
                            image: imagepath,
                            tagField: data,
                            displayCube: rawCube,
                            isMapProjected: isMapProjected,
                            rotationOffset: rotationOffset,
                            origW: w,
                            origH: h,
                            w: userDim[0],
                            h: userDim[1],
                            scalebarLength: "none",
                            scalebarPx: "none",
                            scalebarUnits: scalebarUnits
                        });
                    } else {
                        response.render("image.ejs", {
                            image: imagepath,
                            tagField: data,
                            displayCube: rawCube,
                            isMapProjected: isMapProjected,
                            rotationOffset: rotationOffset,
                            w: w,
                            h: h,
                            origW: w,
                            origH: h,
                            scalebarLength: "none",
                            scalebarPx: "none",
                            scalebarUnits: scalebarUnits
                        });
                    }
                }
            })
            .catch(err => {
                if (err) {
                    console.log("ERROR: " + err);
                }
            });
    }
});

/**
 *
 * 处理图片格式为png的图片下载
 *
 */
router.post("/figureDownload", async function (req, res) {
    console.log(req.url);
    // 得到用户输入的下载文件名
    var filename = req.body.downloadName;

    // 将文件移动到tmp文件夹进行后续的下载
    await req.files.upl.mv("public/tmpImg/" + req.files.upl.name, function (
        err
    ) {
        if (err) {
            console.log("服务器保存时发生错误");
        } else {
            console.log("保存成功");
            // svg格式转化为png格式文件
            svg2img("public/tmpImg/" + req.files.upl.name, function (
                err,
                buffer
            ) {
                if (err) {
                    console.log(err);
                } else {
                    fs.writeFileSync("public/tmpImg/" + filename, buffer);
                    res.download(
                        "public/tmpImg/" + filename,
                        filename,
                        function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log("已启动下载");
                            }
                        }
                    );
                }
            });
        }
    });
});


module.exports = router