import mongoose from 'mongoose';

export type UserType = {
  _id: number;
  phone_number: number;
  priority: 0 | 1 | 2;
};

const UserSchema = new mongoose.Schema({
  _id : {type: Number, required: true, unique:true}
  , phone_number : {type: Number, required: true}
  , priority : {type: Number, required: true}, 
});

const User = mongoose.model<UserType>("User", UserSchema);

export default User;