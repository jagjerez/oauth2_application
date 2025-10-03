import mongoose, { Document, Schema } from 'mongoose';

export interface IPermission extends Document {
  name: string;
  description: string;
  resource: string;
  action: string;
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema = new Schema<IPermission>({
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
  resource: {
    type: String,
    required: true,
    trim: true,
  },
  action: {
    type: String,
    required: true,
    trim: true,
  },
}, {
  timestamps: true,
});

// Register model if it doesn't exist
if (mongoose.models.Permission) {
  delete mongoose.models.Permission;
}

export default mongoose.model<IPermission>('Permission', PermissionSchema);

