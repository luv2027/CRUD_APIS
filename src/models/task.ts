import mongoose from 'mongoose';

export type TaskType = {
  _id: string;
  title: string;
  description: string;
  due_date: Date;
  priority: number;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  user: string;
};

const TaskSchema = new mongoose.Schema({
  title: {type: String, required: true},
  description: {type: String, required: true},
  due_date: {type: Date, required: true},
  priority: {type: Number, required: true},
  status: {type: String, default: "TODO", required: true},
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
});

const Task = mongoose.model<TaskType>("Task", TaskSchema);

export default Task;