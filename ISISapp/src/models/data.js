const mongoose = require("mongoose");

// Explicitly create schema
const dataSchema = new mongoose.Schema(
    {
        fileName: {
            type: String,
            trim: true
        },
        csvData: {
            type: String,
            required: true,
            trim: true
        },
        impData: {
            type: String,
            required: true,
            trim: true
        },
        imageData: {
            type: String,
            required: true,
        }
    }
);

// 用于创建task model
const ISISdata = mongoose.model("ISISdata", dataSchema);

module.exports = ISISdata;
