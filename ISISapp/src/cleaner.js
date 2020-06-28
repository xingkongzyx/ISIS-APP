const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

module.exports = function () {
    try {
        exec("rm images/*.pgw");
        exec("rm uploads/*");
        exec("rm ./print.prt");
        exec("rm public/csv/*.csv");
        exec("rm public/pvl/*.pvl");
        exec("rm public/tmpImg/*");
        exec("rm public/dbData/*");
    
        // 得到images 目录下的文件
        let fileArr = fs.readdirSync("images/");

        // 删除不需要的文件
        for (index in fileArr) {
            if (
                /^.*(?<!arrow|eye_symbol|north|pencil|pencilcursor|sun_symbol|usgsLogo)\.(png)$/gm.test(
                    fileArr[index]
                )
            ) {
                fs.unlinkSync(path.join("images", fileArr[index]));
            }
        }
    } catch (err) {
        console.log("删除文件发生错误 " + err);
    }
}