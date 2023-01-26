import express from "express";
import { logErrors, errorHandler, boomErrorHandler } from './middlewares/error.handler';
import path from "path";
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import 'dotenv/config'

// Init DataBase Connection
require('./configurations/database');

import cors from './configurations/cors'
import createRouter from "./controllers/index"
import { runJobs } from './crons/crons';


const app = express();
app.use(cors());

// view engine setup and send static files
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use(logger('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.set('port', process.env.PORT || 3002)

app.get('/', function (req, res) {
  res.render('index', { title: 'Express' });
});


//create router
createRouter(app);

app.use(logErrors);
app.use(boomErrorHandler);
app.use(errorHandler);

app.listen(app.get('port'), () => {
  console.log('server on port ' + app.get('port'))
})

// run crons (Scheduled works)
runJobs();


module.exports = app;
