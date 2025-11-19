const express = require('express')
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');



// Load env variables
dotenv.config();

// Initialize Express
const app = express();
const port = process.env.PORT || 4000;

// ✅ Connect to MongoDB
connectDB();

// ✅ Security headers
app.use(helmet());

// ✅ Rate limiting (for login to prevent brute force)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP
});

app.use("/api/auth/user/login", limiter);


// ✅ CORS setup
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:4000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ✅ Middleware
app.use(express.json());
app.use(morgan(":method :url :status :res[content-length] - :response-time ms"));

app.get('/', (req, res)=>{
    res.send('Hello from Express , Project Trello 2.0');
});

//API Routes
app.use("/api/auth/user", require("./routes/user.routes"));
app.use("/api/badge",require('./routes/badge.routes'))

app.listen(port,()=>{
    console.log(`The server is Listening on port ${port}`);
})
