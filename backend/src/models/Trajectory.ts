import { Schema, model, Document, Types } from 'mongoose';

export interface ITrajectoryPoint {
  lat: number;
  lng: number;
  timestamp: Date;
}

export interface ITrajectory extends Document {
  userId: Types.ObjectId;
  date: string;
  points: ITrajectoryPoint[];
  totalDistance: number;
  exported: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TrajectorySchema = new Schema<ITrajectory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true },
    points: [
      {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        timestamp: { type: Date, required: true },
      },
    ],
    totalDistance: { type: Number, default: 0 },
    exported: { type: Boolean, default: false },
  },
  { timestamps: true },
);

TrajectorySchema.index({ userId: 1, date: 1 }, { unique: true });

export const Trajectory = model<ITrajectory>('Trajectory', TrajectorySchema);
