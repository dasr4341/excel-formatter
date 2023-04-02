import express, { Application, Request, Response } from "express";
import { config } from './config';
import StatusCodes from 'http-status-codes';
import HttpError from './error/HttpError';

const app:Application = express();

const { port } = config;


app.use((req, res, next) => {
  const error = new HttpError('Page Not Found', StatusCodes.NOT_FOUND, null);
  return next(error);
});


app.use((error: any, req: Request, res: Response, next: any) => {
  const { status } = error;
  res.status(status).json({
    success: false,
    message: error.message,
    data: error.data,
  });
});




app.listen(port, () => {
  console.log(`server is listening at http://localhost:${port}`);
});


