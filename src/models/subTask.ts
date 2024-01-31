import mongoose from 'mongoose';

export type SubTaskType = {
  _id: string;
  task_id: string;
  status: 0 | 1;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date;
};

const SubTaskSchema = new mongoose.Schema({
  task_id: {type: String, required: true},
  status: {type: String, default: 0, required: true},
  created_at: {type: Date,default: Date.now,  require: true}, 
  updated_at: {type: Date,default: Date.now, require: true}, 
  deleted_at: {type: Date, default: null, require: true}, 
});

const SubTask = mongoose.model<SubTaskType>("SubTask", SubTaskSchema);

export default SubTask;