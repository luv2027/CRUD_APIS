import mongoose from 'mongoose';

export type SubTaskType = {
  _id: number;
  task_id: number;
  status: 0 | 1;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date;
};

const SubTaskSchema = new mongoose.Schema({
  _id: {type: Number, required: true, unique:true},
  task_id: {type: Number, required: true},
  status: {type: Number, required: true},
  created_at: {type: Date, require: true}, 
  updated_at: {type: Date, require: true}, 
  deleted_at: {type: Date, require: true}, 
});

const SubTask = mongoose.model<SubTaskType>("SubTask", SubTaskSchema);

export default SubTask;