import express  from "express";
import { Request, Response } from "express";
import cors from 'cors';
import "dotenv/config";
import Task from './models/task';
import SubTask from "./models/subTask";
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
const bodyParser = require('body-parser');
import { check } from "express-validator";
import { validationResult } from "express-validator";
import moment from 'moment';
import jwt from 'jsonwebtoken';
import cron from 'node-cron';
import * as twilio from 'twilio';
import authenticateUser from "./middleware/auth";
import User from "./models/user";

mongoose.connect(process.env.MONGODB_CONNECTION_STRING as string);


const accountSid = 'AC79db4902b569eda92b28dff808d7a235';
const authToken = '851f903cb9a86d72985c03bb43463ce1';
const twilioClient =  new twilio.Twilio(accountSid, authToken);

const app = express();
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  credentials: true,
}));

//creating a new user
app.post('/api/register-user', [
  check("phone_number", "Phone number is required").isNumeric(),
  check("priority", "Priority is required").isNumeric(),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);

  if(!errors.isEmpty()){
    return res.status(400).json({message: errors.array()});
  }

  try{
    const user = await User.create(req.body);
    res.status(201).json({message: "User created successfully", user});
  }
  catch(error: any){
    console.log(error);
    res.status(400).json({message: error.message});
  }
});

app.post('/api/login-user', [
  check("phone_number", "Phone number is required").isNumeric(),
  check("priority", "Priority is required").isNumeric(),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);

  if(!errors.isEmpty()){
    return res.status(400).json({message: errors.array()});
  }


  try{
    const {phone_number} = req.body; 
    const user = await User.findOne({phone_number});

    if(!user){
      return res.status(400).json({message: "User not found"})
    }

    const token = jwt.sign({phone_number : user.phone_number}, process.env.JWT_SECRET_KEY as string, {expiresIn: "1h"});
    res.status(201).json(
      {message: "User logged in successfully", user, meta: {
        access_token: token
      }}
      );
  }
  catch(error: any){
    console.log(error);
    res.status(400).json({message: error.message});
  }
});


//creating a new task
app.post('/api/tasks', authenticateUser, [
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
], async (req: Request, res: Response) => {
  const errors = validationResult(req);

  if(!errors.isEmpty()){
    return res.status(400).json({message: errors.array()});
  }

  try{
    const task = await Task.create(req.body);

    res.status(201).json({message: "Task created successfully", task});
  }
  catch(error: any){
    console.log(error);
    res.status(400).json({message: error.message});
  }
});

//creating a new subtask
app.post('/api/subtasks', authenticateUser,  [ check("task_id", "task_id is required").isString(),
check("status", "Status is required").isString(), 
check("created_at", "created_at is required").custom((value) => {
  if (!moment(value, moment.ISO_8601, true).isValid()) {
    throw new Error("Invalid due date format");
  }
  return true;
}),
check("updated_at", "updated_at is required").custom((value) => {
  if (!moment(value, moment.ISO_8601, true).isValid()) {
    throw new Error("Invalid due date format");
  }
  return true;
}),
check("deleted_at", "deleted_at is required").custom((value) => {
  if (!moment(value, moment.ISO_8601, true).isValid()) {
    throw new Error("Invalid due date format");
  }
  return true;
}),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);

  if(!errors.isEmpty()){
    return res.status(400).json({message: errors.array()});
  }

  try{
    const subtask = await SubTask.create(req.body);

    res.status(201).json({message: "Subtask created successfully", subtask});
  }
  catch(error: any){
    console.log(error);
    res.status(400).json({message: error.message});
  }
});

//fetching all tasks
app.get('/api/tasks',authenticateUser, async (req: Request, res: Response) => {
  try{
    const tasks = await Task.find({deleted_at: null});
    res.status(200).json({message: "Tasks fetched successfully", tasks});
  }
  catch(error: any){
    console.log(error);
    res.status(400).json({message: error.message});
  }
});

//fetching tasks by priority
app.get('/api/tasks/:priority',authenticateUser, async (req: Request, res: Response) => {
  try{
    const tasks = await Task.find({priority: req.params.priority, deleted_at: null});
    res.status(200).json({message: "Tasks fetched successfully", tasks});
  }
  catch(error: any){
    console.log(error);
    res.status(400).json({message: error.message});
  }
});



app.get('/api/subtasks',authenticateUser,  async (req: Request, res: Response) => {
  try{
    const subtasks = await SubTask.find({deleted_at: null});
    res.status(200).json({message: "Subtasks fetched successfully", subtasks});
  }
  catch(error: any){
    console.log(error);
    res.status(400).json({message: error.message});
  }
});


//fetching subtasks by task_id
app.get('/api/subtasks/:task_id',authenticateUser,  async (req: Request, res: Response) => {
  try{
    const subtasks = await SubTask.find({task_id: req.params.task_id});
    res.status(200).json({message: "Subtasks fetched successfully", subtasks});
  }
  catch(error: any){
    console.log(error);
    res.status(400).json({message: error.message});
  }
});


app.put('/api/tasks/:taskId',authenticateUser, async (req: Request, res: Response) => {
  try{
    const {taskId} = req.params;
    const {due_date, status} = req.body;
    const updatedFields = { due_date, status };
    const task = await Task.findByIdAndUpdate(taskId, updatedFields, {new: true});

    if(!task){
      return res.status(404).json({message: `Task not found with ID ${taskId}`});
    }
    res.status(200).json({message: "Task updated successfully", task});
  }
  catch(error: any){
    console.log(error);
    res.status(400).json({message: error.message});
  }
});


app.put('/api/subtasks/:subtaskId',authenticateUser, async (req: Request, res: Response) => {
  try{
    const {subtaskId} = req.params;
  const {status} = req.body;
  const sub_task = await SubTask.findByIdAndUpdate(subtaskId, status, {new: true});

  if(!sub_task){
    return res.status(404).json({message: `Task not found with ID ${subtaskId}`});
  }
  res.status(200).json({message: "Sub_Task updated successfully", sub_task});
}
catch(error: any){
  console.log(error);
  res.status(400).json({message: error.message});
}
});


app.delete('/api/tasks/:taskId',authenticateUser, async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    // Find the task by ID and mark it as deleted
    const deletedTask = await Task.findByIdAndUpdate(
      taskId,
      { deleted_at: new Date() },
      { new: true }
    );

    if (!deletedTask) {
      return res.status(404).json({ message: `Task not found with ID ${taskId}` });
    }

    res.status(200).json({ message: "Task deleted successfully", task: deletedTask });
  } catch (error: any) {
    console.log(error);
    res.status(400).json({ message: error.message });
  }
});


app.delete('/api/subtasks/:subtaskId',authenticateUser, async(req: Request, res: Response) => {
  try {
    const { subtaskId } = req.params;

    // Find the task by ID and mark it as deleted
    const deletedTask = await Task.findByIdAndUpdate(
      subtaskId,
      { deleted_at: new Date() },
      { new: true }
    );

    if (!deletedTask) {
      return res.status(404).json({ message: `Task not found with ID ${subtaskId}` });
    }

    res.status(200).json({ message: "Task deleted successfully", task: deletedTask });
  } catch (error: any) {
    console.log(error);
    res.status(400).json({ message: error.message });
  }
 });

 
 cron.schedule('0 0 * * *', async () => {
   try {
     const today = new Date();

     await Task.updateMany(
       {
         due_date: {
           $eq: today,
         },
       },
       {
         $set: {
           priority: 0,
         },
       }
     );
 
     await Task.updateMany(
       {
         due_date: {
           $gte: today, 
           $lte: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
         },
       },
       {
         $set: {
           priority: 1,
         },
       }
     );
 
     await Task.updateMany(
       {
         due_date: {
           $gte: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
           $lte: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000),
         },
       },
       {
         $set: {
           priority: 2,
         },
       }
     );
 
     await Task.updateMany(
       {
         due_date: {
           $gte: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
         },
       },
       {
         $set: {
           priority: 3,
         },
       }
     );
 
     console.log('Priority update job executed successfully.');
   } catch (error:any) {
     console.error('Error in priority update job:', error.message);
   }
 });

app.listen(7000, () => {
  console.log("Server is listening on port 7000");
});