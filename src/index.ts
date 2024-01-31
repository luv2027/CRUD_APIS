import express  from "express";
import { Request, Response } from "express";
import cors from 'cors';
import "dotenv/config";
import Task from './models/task';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
const bodyParser = require('body-parser');
import { check } from "express-validator";
import { validationResult } from "express-validator";
import moment from 'moment';
import jwt from 'jsonwebtoken';
import authenticateUser from "./middleware/auth";
import User from "./models/user";

mongoose.connect(process.env.MONGODB_CONNECTION_STRING as string);

const app = express();
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  credentials: true,
}));


app.post('/api/tasks', [
  check("title", "Title is required").isString(),
  check("description", "Description is required").isString(),
  check("due_date", "Due date is required").custom((value) => {
    if (!moment(value, moment.ISO_8601, true).isValid()) {
      throw new Error("Invalid due date format");
    }
    return true;
  }),
  check("priority", "Priority is required").isNumeric(),
  check("status", "Status is required").isString(),
  check("user", "User is required").isString(),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);

  if(!errors.isEmpty()){
    return res.status(400).json({message: errors.array()});
  }

  try{
    const task = await Task.create(req.body);
    const token = jwt.sign({userId: task._id}, process.env.JWT_SECRET_KEY as string, {expiresIn: "1h"});

    res.status(201).json({message: "Task created successfully", task});
  }
  catch(error: any){
    console.log(error);
    res.status(400).json({message: error.message});
  }
});

app.post('/api/subtasks', authenticateUser, async (req: Request, res: Response) => {
  
 });

//app.get('/api/tasks', authenticateUser, async (req, res) => {
//});

// app.get('/api/subtasks', authenticateUser, async (req, res) => {
// });


// app.put('/api/tasks/:taskId', authenticateUser, async (req, res) => {
// });


// app.put('/api/subtasks/:subtaskId', authenticateUser, async (req, res) => {
// });


// app.delete('/api/tasks/:taskId', authenticateUser, async (req, res) => {
// });


// app.delete('/api/subtasks/:subtaskId', authenticateUser, async (req, res) => {
// });


// cron.schedule('0 0 * * *', async () => {
// });


// cron.schedule('0 0 * * *', async () => {
// });


app.listen(7000, () => {
  console.log("Server is listening on port 7000");
});