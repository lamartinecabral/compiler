// @ts-check

const express = require("express");
const cors = require("cors");

const { runcpp, runjs, enterQueue } = require("./utils");

const app = express();
const port = 3000;

app.use(cors());

app.use(express.static("public"));

const jsonParser = express.json({ type: "*/*" });

const runner = (lang) => {
  switch (lang) {
    case "js":
      return runjs;
    case "cpp":
      return runcpp;
    default:
      return () => Promise.reject("invalid language");
  }
};

app.post("/compile", jsonParser, (req, res) => {
  const { code, stdin, lang } = req.body;
  if (!code) return res.send({ error: "no code" });
  enterQueue()
    .then((leave) => {
      runner(lang)(code, [], stdin).then(({ stdout, time, error }) => {
        leave();
        if (error) res.send({ error });
        else res.send({ stdout, time });
      });
    })
    .catch((error) => {
      res.send({ error });
    });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
