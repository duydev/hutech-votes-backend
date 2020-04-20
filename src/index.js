const config = require('config');
const http = require('http');
const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');
const morgan = require('morgan');

const router = require('./router');
const errorHandlerMiddleware = require('./middleware/error-handler');

require('./db');

const PORT = process.env.PORT || config.get('port');
const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(bodyParser.json({}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(compression());
app.use(cors());
app.use(morgan('combined'));

app.use('/api', router);
app.use(errorHandlerMiddleware);

app.listen(PORT, () => {
  console.log(`[pid ${process.pid}] App listening on port ${PORT}.`);
});
