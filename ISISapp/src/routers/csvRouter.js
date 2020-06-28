const express = require("express");
const path = require("path");
const ISIShelper = require("../ISIShelper.js");

const { ISISdataArr } = require("./captionWriter.js");

const router = new express.Router();


/**
 * POST '/csv'
 *
 *  获取user cookie并进行csv文件的下载
 */
router.post("/csv", function (request, response) {
    let cubeObj = ISIShelper.getObjectFromArray(request.cookies["userId"], ISISdataArr);

    if (typeof cubeObj === "object") {
        response.download(
            path.join("public/csv", cubeObj.name.replace(".cub", "_数据.csv")),
            function (err) {
                if (err) {
                    console.log("文件没有发送成功！");
                } else {
                    response.status(200);
                    response.end();
                }
            }
        );
    } else {
        response.redirect("/?alertCode=4");
    }
});

/**
 * GET '/csv'
 *
 * 当用户主动输入/csv界面时启动下载
 */
router.get("/csv", function (req, res) {
    console.log(`正在使用 ${req.method}协议访问 ${req.path}`)

    let userId = req.cookies["userId"];

    if (userId === undefined) {
        res.redirect("/?alertCode=7");
    } else {
        let userObject = ISIShelper.getObjectFromArray(userId, ISISdataArr);

        if (typeof userObject !== "number") {
            res.download(
                path.join("public/csv", userObject.name.replace(".cub", "_数据.csv")),
                function (err) {
                    if (err) {
                        console.log("文件没有发送成功！");
                    } else {
                        res.status(200);
                        res.end();
                    }
                }
            );
        } else {
            res.redirect("/?alertCode=4");
        }
    }
});


module.exports = { router, ISISdataArr }