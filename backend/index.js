const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");


// Import routes and auth middleware
const userRoute = require("./routes/user");
const receiptRoute = require("./routes/receipt");
const historyRoute = require("./routes/history");
const auth = require("./middleware/auth");

// Set up multer to save images to disk
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'receiptParser/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '.jpg');
    }
});
const upload = multer({ storage: storage });

// Handle uncaught exceptions and unhandled rejections
process.on("uncaughtException", (err, origin) => {
    console.log("Uncaught Exception:", err, "Origin", origin);
});

process.on("unhandledRejection", (reason, promise) => {
    console.log("Unhandled Rejection at:", promise, "reason:", reason);
});

const app = express();

// Parse requests of content-type - application/json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Home page just returns a message
app.get("/", (req, res) => { 
    res.send("Shop Pal API");
});

// Routes
app.use("/user", userRoute);
app.use("/receipt", upload.single('file'), auth, receiptRoute);
app.use("/history", auth, historyRoute);

// Set port, listen for requests
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server is running on port " + port);
});
