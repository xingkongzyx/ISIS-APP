/**
 * @file index.js
 * @requires Jquery 2.0.0
 * @fileoverview 用于处理从index page向服务器发送文件
 */

/** 变量  */
var alerted = false,
    // 得到需要的dom元素
    loader,
    // 尺寸上用户的输入
    widthInputBox,
    heightInputBox,
    alertCode;

/**
 * @function codeToAlert
 *
 * @description 读取alertCode变量并使对应警告显示于屏幕
 */
function codeToAlert() {
    if (alertCode == 1) {
        window.alert("请上传一个.cub文件!")
    } else if (alertCode == 2) {
        window.alert("Template必须为空或者为.tpl格式文件!")
    } else if (alertCode == 4) {
        window.alert("上一个用户没有服务器数据，请重新上传!")
    } else if (alertCode == 5) {
        window.alert("上传失败，请重试！")
    } else if (alertCode == 6) {
        window.alert("无法通过上传文件创建图像，请重试！")
    } else if (alertCode == 7) {
        window.alert("请上传一个cube文件")
    } else if (alertCode == 8) {
        window.alert("服务器故障: 没有启动ISIS环境，请启动后重试!")
    } else if (alertCode != 0) {
        window.alert("请上传一个.cub文件,Template必须为空或者为.tpl格式文件!")
    }
}

/**
 * @function setNotVisible
 *
 * @param {DOM element} element 拥有x按钮的元素
 *
 * @description 当x按钮使用时隐藏警告框
 */
function setNotVisible(element) {
    var hideElement = document.getElementById(
        $(element)
            .parent()
            .attr("id")
    );
    hideElement.style.visibility = "hidden";
}

/**
 * @function loadInvisible
 *
 * @description 隐藏加载标志
 */
function loadInvisible() {
    loader.style.visibility = "hidden";
}

/**
 * @function loaderActivate
 *
 * @description 展现加载标志
 */
function loaderActivate() {
    // 如果表格已经被提交则忽略对这个方程的调动
    if (document.uploadForm.onsubmit && !document.uploadForm.onsubmit()) {
        return;
    } else {
        if (heightInputBox.value === "" && widthInputBox.value === "") {
            heightInputBox.value = 900;
            widthInputBox.value = 900;
            loader.style.visibility = "visible";
            document.uploadForm.submit();
        } else {
            loader.style.visibility = "visible";
            document.uploadForm.submit();
        }
    }
}

/**
 * @function checkInput
 *
 * @description 不断检查宽度和高度的输入值，如果过大，则通知用户1次
 */
function checkInput() {
    let width = widthInputBox.value;
    let height = heightInputBox.value;

    if (!alerted) {
        if (
            width >= window.screen.width - window.screen.width * 0.5 &&
            width !== "900"
        ) {
            alert("警告：输入的宽度数值过大 ");
            alerted = true;
        } else if (
            height >= window.screen.height - window.screen.height * 0.5 &&
            height !== "900"
        ) {
            alert("警告：输入的高度数值过大 ");
            alerted = true;
        }
    }
}
setInterval(checkInput, 1500);

/** ------------------------------------------- Jquery代码 --------------------------------------------------- */
/**
 * @function ready 在页面加载后运行的侦听器
 *
 * @description 加载文档之后，获取这些函数所需的 DOM 元素
 */
$(document).ready(function () {
    loader = document.getElementById("loading");

    // 获取输入尺寸的dom
    widthInputBox = document.getElementById("widthInput");
    heightInputBox = document.getElementById("heightInput");

    var pageVariable = document.getElementById("pageVariable");

    for (let i = 0; i < pageVariable.childElementCount; i++) {
        if (pageVariable.children[i].id === "alertCode") {
            alertCode = pageVariable.children[i].innerHTML;
        }
    }
});

/**
 * @function window 'pageshow' 时间触发器
 *
 * @description 为页面的初始加载运行启动函数
 */
$(window).bind("pageshow", function (event) {
    // 检查页面是否从缓存中加载
    if (event.originalEvent.persisted) {
        loadInvisible();
        codeToAlert();
    } else {
        codeToAlert();
    }
});
