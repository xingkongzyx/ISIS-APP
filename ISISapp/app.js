// 需要的dependencies
const express = require("express");
const fileUpload = require("express-fileupload");
const cookieparser = require("cookie-parser");
const bodyParser = require("body-parser");
require("./src/mongoose");

const cleanFiles = require("./src/cleaner");
const { router: writerRouter } = require("./src/routers/captionWriter")
const { router: CSVRouter } = require("./src/routers/csvRouter")
const imageRouter = require("./src/routers/imageRouter")
const appRouter = require("./src/routers/homeRouter")
const downloadRouter = require("./src/routers/downloadRouter")

var app = express();


// 使用express 中间件
app.use(fileUpload());
app.use(cookieparser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set("etag", false);
app.disable("view cache");


app.use(express.static("public"));
app.use("/images", express.static("images"));

const PORT = 3000 || process.env.PORT;

// 设置渲染引擎
app.set("view engine", "ejs");

// 注册router
app.use(appRouter);
app.use(writerRouter);
app.use(CSVRouter);
app.use(imageRouter);
app.use(downloadRouter);

cleanFiles();

// 启动server,端口3000
app.listen(PORT, () => {
    console.log("服务器正在运行于端口 " + PORT);
});


