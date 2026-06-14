import { Schema, model, Document, Types } from 'mongoose';

export interface ILocation extends Document {
  userId: Types.ObjectId;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  radius: number;
  visitCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, maxlength: 100 },
    address: { type: String, default: '' },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    radius: { type: Number, default: 200, min: 50, max: 5000 },
    visitCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

LocationSchema.index({ userId: 1, 'coordinates.lat': 1, 'coordinates.lng': 1 });

export const Location = model<ILocation>('Location', LocationSchema);
