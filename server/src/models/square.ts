import mongoose, { Schema, Document } from 'mongoose';

export interface ISquare extends Document {
  userId: string;
  title?: string;
  caption?: string;
  styleTags?: string[];
  sceneTags?: string[];
  publishedTime?: Date;
  viewCount?: number;
  likeCount?: number;
  collectCount?: number;
  imageUrl?: string; 
}

const SquareSchema: Schema = new Schema({
  userId: { type: String, required: true },
  title: { type: String },
  caption: { type: String },
  styleTags: [String],
  sceneTags: [String],
  publishedTime: { type: Date, default: Date.now },
  viewCount: { type: Number, default: 0 },
  likeCount: { type: Number, default: 0 },
  collectCount: { type: Number, default: 0 },
  imageUrl: { type: String }
});

export default mongoose.model<ISquare>('Square', SquareSchema);
