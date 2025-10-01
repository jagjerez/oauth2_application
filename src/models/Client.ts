import mongoose, { Document, Schema } from 'mongoose';

export interface IClient extends Document {
  clientId: string;
  clientSecret: string;
  name: string;
  description?: string;
  redirectUris: string[];
  grantTypes: string[];
  responseTypes: string[];
  scopes: string[];
  isConfidential: boolean;
  isActive: boolean;
  tokenEndpointAuthMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>({
  clientId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  clientSecret: {
    type: String,
    required: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  redirectUris: [{
    type: String,
    required: true,
  }],
  grantTypes: [{
    type: String,
    enum: ['authorization_code', 'client_credentials', 'refresh_token'],
    required: true,
  }],
  responseTypes: [{
    type: String,
    enum: ['code', 'id_token', 'token'],
    required: true,
  }],
  scopes: [{
    type: String,
    required: true,
  }],
  isConfidential: {
    type: Boolean,
    default: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  tokenEndpointAuthMethod: {
    type: String,
    enum: ['client_secret_basic', 'client_secret_post', 'none'],
    default: 'client_secret_basic',
  },
}, {
  timestamps: true,
});

// Index for efficient queries
ClientSchema.index({ clientId: 1 });
ClientSchema.index({ isActive: 1 });

export default mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);

