const express = require('express');
const apiMocker = require('mocker-api');

const app = express();
const port = process.env.API_PORT || 3000;
const cors = require('cors');


app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET","PUT","POST", "OPTIONS", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);


app.options("*", cors());

apiMocker(app, require.resolve('./index'));
app.listen(port, () => {
  console.log(`Server running on port ${port} => http://localhost:${port}`);
});
