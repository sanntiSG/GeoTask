import { Schema, model, Document, Types } from 'mongoose';

export type TaskStatus = 'pending' | 'done' | 'discarded';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ITask extends Document {
  userId: Types.ObjectId;
  locationId: Types.ObjectId;
  title: string;
  emoji: string;
  color: string;
  priority: TaskPriority;
  status: TaskStatus;
  recurrence: {
    enabled: boolean;
    days: number[];
  };
  notifyAgainAfter: number;
  notifyAgainEnabled: boolean;
  lastNotified?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true, index: true },
    title: { type: String, required: true, maxlength: 200 },
    emoji: { type: String, default: '📍' },
    color: { type: String, default: '#0a84ff' },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'done', 'discarded'],
      default: 'pending',
      index: true,
    },
    recurrence: {
      enabled: { type: Boolean, default: false },
      days: { type: [Number], default: [] },
    },
    notifyAgainAfter: { type: Number, default: 30 },
    notifyAgainEnabled: { type: Boolean, default: false },
    lastNotified: Date,
    completedAt: Date,
  },
  { timestamps: true },
);

TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, locationId: 1, status: 1 });

export const Task = model<ITask>('Task', TaskSchema);
