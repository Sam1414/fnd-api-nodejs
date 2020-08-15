const express = require('express');
const router = express.Router();
const axios = require('axios');
const { response } = require('./app');
const tf = require("@tensorflow/tfjs-node");
const ecoder = require("@tensorflow-models/universal-sentence-encoder");

let model;
let encoder;
(async function () {
    model = await tf.loadLayersModel('http://127.0.0.1:1501/tfjs-models/model_1/model.json');
    encoder = await ecoder.load();
})();


router.use(function (req, res, next) {
    console.log(`${new Date()} = ${req.method} request for ${req.url}`);
    next();
});

router.get("/", async (req, res, next) => {
    var url = req.query.url;
    //  Checking if the query is in URL format or not
    const isValidUrl = checkUrl(url);

    if (isValidUrl && url != undefined) {
        try {
            result = await compute(url);
            res.status(201).json({
                prediction: result.prediction,
                stance: result.stance,
                similarity: result.similarity,
                data: result.data,
            });
        } catch (e) {
            console.log(e);
        }
    } else if (url === undefined) {
        res.status(200).json({
            message: "No URL provided",
        });
    } else {
        const error = new Error("Invalid Url");
        error.status = 500;
        next(error);
    }
});

router.post("/", async (req, res, next) => {
    var url = req.query.url;
    //  Checking if the query is in URL format or not
    isValidUrl = checkUrl(url);

    if (isValidUrl && url != undefined) {
        try {
            result = await compute(url);
            res.status(201).json({
                prediction: result.prediction,
                stance: result.stance,
                similarity: result.similarity,
                data: result.data,
            });
        } catch (e) {
            console.log(e);
        }
    } else if (url === undefined) {
        res.status(200).json({
            message: "No URL provided",
        });
    } else {
        const error = new Error("Invalid Url");
        error.status = 500;
        next(error);
    }
});

function checkUrl(url) {
    let regEx = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%.\+#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%\+.#?&//=]*)$/gm;
    var isValidUrl = regEx.test(url);
    console.log("isValidUrl: " + isValidUrl);
    return isValidUrl;
}

async function compute(url) {
    // Getting Articles from News Scraping API
    const d = await axios.get("http://nscrape-app.herokuapp.com/input/?url=" + url);
    const data = d.data;
    console.log(data);

    // Encoding the Articles
    const sentences = [
        data.user_data.content,
        data.admin_data.content
    ];

    const emb = await encoder.embed(sentences);
    emb.print();
    const user_emb = tf.gatherND(emb, [[0][0]]);
    const admin_emb = tf.gatherND(emb, [[1][0]]);
    user_emb.print();
    admin_emb.print();

    // Getting Similarity between embedded vectors
    var sim = tf.dot(user_emb, admin_emb);
    sim = tf.reshape(sim, [1]);
    sim.print();
    const similarity = sim.dataSync()[0];

    // Constructing Feature Vector: user_emb + similarity + admin_emb
    var feat_vec = tf.concat([user_emb, sim, admin_emb], -1);
    feat_vec.print();
    console.log(feat_vec.shape);
    feat_vec = tf.reshape(feat_vec, [1, 1025]);

    // Making Prediction
    const label = model.predict(feat_vec).argMax(-1).dataSync()[0];
    console.log("Label: " + label);
    const meaning = { 0: 'Agree', 1: 'Disagree', 2: 'Discuss', 3: 'Unrelated' };
    const stance = meaning[label];
    console.log("Stance: " + stance);
    const binary_classification = { "Agree": "Real", "Discuss": "Real", "Disagree": "Fake", "Unrelated": "Fake" };
    prediction = binary_classification[stance];
    console.log("prediction: " + prediction);
    const result = { "prediction": prediction, "stance": stance, "similarity": similarity, "data": data };
    return result;
}

module.exports = router;