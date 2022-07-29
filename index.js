import express from "express";
import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { nanoid } from "nanoid";
import urlExist from "url-exist";
import cors from "cors";
const corsOptions = {
   origin:'*', 
   credentials:true,       
   optionSuccessStatus:200,
};
import URL from "./models/urlModel.js";

const __dirname = path.resolve();

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(cors(corsOptions));

mongoose.connect(process.env.MONGO_DB_URI, (err) => {
  if (err) {
    throw err;
  }
  console.log("Database connected successfully");
});

// Middleware to validate url
const validateURL = async (req, res, next) => {
  const { url } = req.body;
  const isExist = await urlExist(url);
  if (!isExist) {
    return res.json({ message: "Invalid URL", type: "failure" });
  }
  next();
};

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/link", validateURL, async (req, res) => {
  const { url } = req.body;
  console.log(url);
  const result = await URL.findOne({url : url});
  console.log(result);
  if(result){
    // console.log(" result is:  "+result.id);
    res.json({ message: `URL already exist\nhttps://urlshortener98.herokuapp.com/${result.id}`, type: "success" });
  }
  else{
    let id = nanoid(7);
    let newURL = new URL({ url, id });
    try {
      newURL.save();
    } catch (err) {
      res.send("An error was encountered! Please try again.");
    }
    // Send the server address with the unique id
    res.json({ message: `https://urlshortener98.herokuapp.com/${newURL.id}`, type: "success" });
  }
  // Generate a unique id to identify the url in the database
});

app.get("/:id", async (req, res) => {
  const id = req.params.id;

  const originalLink = await URL.findOne({ id });

  if (!originalLink) {
    return res.sendFile(__dirname + "/public/404.html");
  }
  res.redirect(originalLink.url);
});

app.listen(process.env.PORT || 8000, () => {
  console.log("App listening on port 8000");
});
