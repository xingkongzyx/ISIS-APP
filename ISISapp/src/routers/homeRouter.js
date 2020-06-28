const express = require("express");
const chalk = require("chalk")
const router = new express.Router();

/**
 * 产生首页
 */
router.get("/", function (req, res) {
    console.log(`正在使用 ${req.method}协议访问 ${req.path}`)
    let code = req.query.alertCode;

    alertCode = code === undefined ? 0 : code;

    // 用alertcode和index.ejs渲染界面
    res.status(200).render("index.ejs", { alertCode });
});


/**
 * 处理404页面
 */
router.get("*", function (req, res) {
    console.log(chalk.green("进入404页面，请重试"));
    res.status(404).render("404.ejs");
});

module.exports = router;