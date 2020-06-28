const express = require("express");
var AdmZip = require('adm-zip');
const fs = require("fs");
const fse = require('fs-extra')

var path = 'public/dbData/';
const ISISdata = require("../models/data")
const router = new express.Router();


const downloadData = (data)=>{
    fse.emptyDirSync(path);
    // 每次zip前必须设定一个新的zip流避免多个文件一起zip
    var zip = new AdmZip();
    const { fileName, csvData, impData, imageData } = data;
    const zipName = fileName.replace(".cub", ".zip");

    const impFileName = zipName.replace(".zip", "") + "ImportantData.txt"
    const wholeFileName = zipName.replace(".zip", "") + "wholeData.txt"
    fs.writeFileSync("public/dbData/" + zipName.replace(".zip", ".png"), imageData, "base64")
    fs.writeFileSync('public/dbData/' + impFileName, impData.split(",").join("\n"))
    fs.writeFileSync('public/dbData/' + wholeFileName, csvData)

    zip.addLocalFile("public/dbData/" + zipName.replace(".zip", ".png"));
    zip.addLocalFile('public/dbData/' + impFileName)
    zip.addLocalFile('public/dbData/' + wholeFileName);
    zip.writeZip("public/dbData/" + zipName);
    return zipName;
}


router.post("/downloadPrevious", async (req, res) => {
    console.log(`正在使用 ${req.method}协议访问 ${req.path}`)
    const lastData = await ISISdata.findOne({}, null, { sort: { "_id": 1 } });
    if (!lastData) {
        console.log("没有找到上次使用的文件请重试")
        res.end();
    }

    const zipName = downloadData(lastData)

    res.download("public/dbData/" + zipName, function (err) {
        if (err) {
            console.log("下载上次数据时出错");
        }
        else {
            console.log("下载上次数据成功！")
            res.end();
        }

    });
})


router.post("/downloadCurrent", async (req, res) => {
    console.log(`正在使用 ${req.method}协议访问 ${req.path}`)
    const currentData = await ISISdata.findOne({}, null, { sort: { "_id": -1 } });
    if (!currentData) {
        console.log("没有找到当前使用的文件请重试")
        res.end();
    }

    const zipName = downloadData(currentData)

    // 写入文件夹 it's important to use *binary* encode
    // fs.writeFileSync('public/dbData/' + zipName, data, 'binary');
    res.download("public/dbData/" + zipName, function (err) {
        if (err) {
            console.log("下载当前数据时出错");
        }
        else {
            console.log("下载当前数据成功！")
            res.end();
        }

    });
})


module.exports = router;