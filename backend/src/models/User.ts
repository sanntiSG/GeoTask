import { Schema, model, Document } from 'mongoose';

export interface IUserSettings {
  trackingStart: string;
  trackingEnd: string;
  defaultRadius: number;
  notificationInterval: number;
  renotifyAfter: number;
  renotifyEnabled: boolean;
}

export interface ILastPosition {
  lat: number;
  lng: number;
  updatedAt: Date;
}

export interface IUser extends Document {
  googleId: string;
  email: string;
  name: string;
  avatar: string;
  role: 'user' | 'admin';
  lastPosition?: ILastPosition;
  settings: IUserSettings;
  visitCounts: Map<string, number>;
  lastActive: Date;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    lastPosition: {
      lat: Number,
      lng: Number,
      updatedAt: { type: Date, default: Date.now },
    },
    settings: {
      trackingStart: { type: String, default: '06:00' },
      trackingEnd: { type: String, default: '23:00' },
      defaultRadius: { type: Number, default: 200 },
      notificationInterval: { type: Number, default: 60 },
      renotifyAfter: { type: Number, default: 30 },
      renotifyEnabled: { type: Boolean, default: true },
    },
    visitCounts: { type: Map, of: Number, default: {} },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const User = model<IUser>('User', UserSchema);
