import mongoose, { Document, Schema } from 'mongoose';
import { IPermission } from './Permission';

export interface IRole extends Document {
  name: string;
  description: string;
  permissions: mongoose.Types.ObjectId[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  permissions: [{
    type: Schema.Types.ObjectId,
    ref: 'Permission',
  }],
  isSystem: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);

