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

//creating a new user
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

//creating a new subtask
app.post('/api/subtasks',  [ check("task_id", "task_id is required").isString(),
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
    const token = jwt.sign({userId: subtask._id}, process.env.JWT_SECRET_KEY as string, {expiresIn: "1h"});

    res.status(201).json({message: "Subtask created successfully", subtask});
  }
  catch(error: any){
    console.log(error);
    res.status(400).json({message: error.message});
  }
});

//fetching all tasks
app.get('/api/tasks', async (req: Request, res: Response) => {
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
app.get('/api/tasks/:priority', async (req: Request, res: Response) => {
  try{
    const tasks = await Task.find({priority: req.params.priority, deleted_at: null});
    res.status(200).json({message: "Tasks fetched successfully", tasks});
  }
  catch(error: any){
    console.log(error);
    res.status(400).json({message: error.message});
  }
});



app.get('/api/subtasks',  async (req, res) => {
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
app.get('/api/subtasks/:task_id',  async (req, res) => {
  try{
    const subtasks = await SubTask.find({task_id: req.params.task_id});
    res.status(200).json({message: "Subtasks fetched successfully", subtasks});
  }
  catch(error: any){
    console.log(error);
    res.status(400).json({message: error.message});
  }
});


app.put('/api/tasks/:taskId', async (req: Request, res: Response) => {
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


app.put('/api/subtasks/:subtaskId',async (req: Request, res: Response) => {
  try{
    const {subtaskId} = req.params;
  const {status} = req.body;
  const task = await Task.findByIdAndUpdate(subtaskId, status, {new: true});

  if(!task){
    return res.status(404).json({message: `Task not found with ID ${subtaskId}`});
  }
  res.status(200).json({message: "Task updated successfully", task});
}
catch(error: any){
  console.log(error);
  res.status(400).json({message: error.message});
}
});


app.delete('/api/tasks/:taskId', async (req: Request, res: Response) => {
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


app.delete('/api/subtasks/:subtaskId', async(req: Request, res: Response) => {
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


// cron.schedule('0 0 * * *', async () => {
// });


// cron.schedule('0 0 * * *', async () => {
// });


app.listen(7000, () => {
  console.log("Server is listening on port 7000");
});