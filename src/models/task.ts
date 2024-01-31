import mongoose from 'mongoose';

export type TaskType = {
  _id: number;
  title: string;
  description: string;
  due_date: Date;
  priority: 0| 1 | 2 | 3;
  status: "TODO" | "IN_PROGRESS" | "DONE";
};

const TaskSchema = new mongoose.Schema({
  _id: {type: Number, required: true, unique:true},
  title: {type: String, required: true},
  description: {type: String, required: true},
  due_date: {type: Date, required: true},
  priority: {type: Number, required: true},
  status: {type: String, required: true},
});

const Task = mongoose.model<TaskType>("Task", TaskSchema);

export default Task;