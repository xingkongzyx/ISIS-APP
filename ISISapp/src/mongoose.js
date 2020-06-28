const mongoose = require("mongoose");

// 使用mongoose model然后连接到数据库
mongoose.connect("mongodb://mongo:27017/ISISdata", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});