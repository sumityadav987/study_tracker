import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  uid: string; // Firebase UID
  email: string;
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
}

const userSchema = new Schema<IUser>({
  uid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastSyncAt: {
    type: Date
  }
}, {
  timestamps: true
});

export const User = mongoose.model<IUser>('User', userSchema);