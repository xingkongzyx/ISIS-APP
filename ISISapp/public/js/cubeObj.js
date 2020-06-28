/**
 * @file cubeObj.js
 * 
 * @class ISIS3 Cubes
 *
 * @constructor cubeName, userId
 *
 * @classdesc 在客户端cookies的帮助下使server更容易被管理, 这个class是一个数据结构
 */
module.exports = class Cube {
	/**
	 * @constructor Cube()
	 *
	 * @param {sting} cubeName 上传的cube文件名称
	 * @param {string} userId 23位随机生成的 userId
	 */
    constructor(cubeName, userId) {
        this._userId = userId;
        this._cubeName = cubeName;
        // 用于跟踪服务器上的用户实例（短于userid）
        this._userNum;
        // 初始化JSON元素 所有数据及重要数据
        this._data = {};
        this._impData = {};
        // 初始化图像尺寸
        this._userDim = [0, 0];
        // 是否应该记录到文件的标志
        // this._logFlag = false;
    }

    // 获得cube文件名
    get name() {
        return this._cubeName;
    }

    // 设置cube文件名
    set name(name) {
        if (typeof name === "string") {
            this._cubeName = name;
        }
    }

    // 获得userNum
    get userNum() {
        return this._userNum;
    }

    // 设置userNum
    set userNum(num) {
        this._userNum = Number(num);
    }

    // 获得userId
    get userId() {
        return this._userId;
    }

    // 以json形式获得_data value
    get data() {
        return JSON.stringify(this._data);
    }

    // 以json形式设置_data value
    set data(data) {
        if (typeof data === "object") {
            this._data = data;
        }
    }

    // 获得user dimensions of figure
    get userDim() {
        return this._userDim;
    }

    // 设置user dimensions of figure
    set userDim(dimArray) {
        this._userDim = dimArray;
    }

    // 获得JSON形式的important data
    get impData() {
        return JSON.stringify(this._impData);
    }

    //  向cube obj中添加important tag object
    set impData(data) {
        if (typeof data === "object") {
            this._impData = data;
        }
    }

    getCubeDimensions() {
        var cubeObj = this;
        return new Promise(function (resolve, reject) {
            var fs = require("fs"),
                path = require("path");

            fs.readFile(path.join("./uploads", cubeObj.name), (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    var bufferArray = data
                        .subarray(0, data.length / 10)
                        .toString()
                        .split("\n");

                    for (let index = 0; index < bufferArray.length; index++) {
                        if (
                            bufferArray[index].indexOf("Group = Dimensions") >
                            -1
                        ) {
                            var samples = Number(
                                bufferArray[index + 1].split("=")[1]
                            );
                            var lines = Number(
                                bufferArray[index + 2].split("=")[1]
                            );
                            var dim = { w: samples, h: lines };
                            resolve(JSON.stringify(dim));
                        }
                    }
                    reject();
                }
            });
        });
    }
};
