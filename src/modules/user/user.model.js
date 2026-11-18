
import mongoose from 'mongoose';

const USER_STATUS = Object.freeze({
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DISABLED: 'disabled',
});

const normalizePhone = (value) => {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();

  if (!trimmed) return undefined;

  const prefix = trimmed.startsWith('+') ? '+' : '';
  const digits = trimmed.replace(/\D/g, '');

  return digits ? `${prefix}${digits}` : undefined;
};

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 80,
      default: undefined,
    },

    lastName: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 80,
      default: undefined,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    phone: {
      type: String,
      default: undefined,
      set: normalizePhone,
      maxlength: 16,
      match: /^\+?\d{5,15}$/,
    },

    emailVerifiedAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.PENDING,
    },
  },
  {
    timestamps: true,
    strict: 'throw',
  },
);

// Account activation requirements.
userSchema.pre('validate', function () {
  if (this.status !== USER_STATUS.ACTIVE) return;

  if (!this.firstName) {
    this.invalidate(
      'firstName',
      'First name is required before account activation.',
    );
  }

  if (!this.lastName) {
    this.invalidate(
      'lastName',
      'Last name is required before account activation.',
    );
  }

  if (!this.phone) {
    this.invalidate(
      'phone',
      'Phone number is required before account activation.',
    );
  }

  if (!this.emailVerifiedAt) {
    this.invalidate(
      'emailVerifiedAt',
      'Email verification is required before account activation.',
    );
  }
});

// Unique email across all account statuses.
userSchema.index(
  { email: 1 },
  {
    unique: true,
    name: 'uniq_users_email',
  },
);

// Unique phone when a phone number exists.
userSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: {
      phone: { $type: 'string' },
    },
    name: 'uniq_users_phone',
  },
);

const User = mongoose.model('User', userSchema);

export { USER_STATUS };
export default User;
