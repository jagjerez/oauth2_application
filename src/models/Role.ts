import mongoose, { Document, Schema } from 'mongoose';
import { IPermission } from './Permission';

export interface IRole extends Document {
  name: string;
  description: string;
  permissions: mongoose.Types.ObjectId[];
  clientId?: string; // Associate role with a specific client
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>({
  name: {
    type: String,
    required: true,
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
  clientId: {
    type: String,
    trim: true,
    index: true,
  },
  isSystem: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Create compound index for unique name per client
RoleSchema.index({ name: 1, clientId: 1 }, { unique: true });

export default mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);

