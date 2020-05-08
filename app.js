const fs = require("fs");
const express = require("express");
const morgan = require("morgan");

const AppError = require("./utilities/appError");
const globalErrorHandler = require("./controllers/errorController");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");

const app = express();

//1) MIDDLEWARES
console.log(process.env.NODE_ENV);
if(process.env.NODE_ENV === 'development')
{
  app.use(morgan('dev'));
}

app.use(morgan('dev')); 
app.use(express.json()); //middleware
app.use(express.static(`${__dirname}/public`));


app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    console.log(req.headers);
    next();
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// app.all('*', (req, res, next) => {
//   res.status(400).json({
//     status: 'fail',
//     message: `Can't find ${req.originalUrl} on this server!`
//   });
// });

app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

//Global Error Handling
app.use(globalErrorHandler);
module.exports = app;
