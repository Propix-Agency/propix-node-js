import mongoose from 'mongoose';

const USER_STATUS = Object.freeze({
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DISABLED: 'disabled',
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_REGEX = /^\+[1-9]\d{1,14}$/;

/**
 * Normalize common phone-number presentation characters without silently
 * removing letters or other invalid characters. Validation happens afterward.
 */
const normalizePhone = (value) => {
  if (typeof value !== 'string') return value;

  const normalized = value.trim().replace(/[\s().-]/g, '');

  return normalized || undefined;
};

const isActivationAttempt = (user) =>
  user.status === USER_STATUS.ACTIVE &&
  (user.isNew || user.isModified('status'));

const getActivationErrors = (user) => {
  const errors = [];

  if (user.deletedAt) {
    errors.push([
      'deletedAt',
      'A deleted account cannot be activated.',
    ]);
  }

  if (!user.firstName) {
    errors.push([
      'firstName',
      'First name is required before account activation.',
    ]);
  }

  if (!user.lastName) {
    errors.push([
      'lastName',
      'Last name is required before account activation.',
    ]);
  }

  if (!user.emailVerifiedAt) {
    errors.push([
      'emailVerifiedAt',
      'Email verification is required before account activation.',
    ]);
  }

  return errors;
};

/**
 * Query updates must not change account status. Status transitions must load
 * the User document and use save(), so document validation cannot be bypassed.
 */
const containsStatusPath = (value, seen = new WeakSet()) => {
  if (!value || typeof value !== 'object') return false;
  if (seen.has(value)) return false;
  seen.add(value);

  if (Object.hasOwn(value, 'status')) return true;

  return Object.values(value).some((nestedValue) =>
    containsStatusPath(nestedValue, seen),
  );
};

const preventQueryStatusUpdate = function () {
  if (containsStatusPath(this.getUpdate())) {
    throw new mongoose.Error(
      'User status cannot be changed through query updates. Load the User document and call save().',
    );
  }
};

const preventReplacement = function () {
  throw new mongoose.Error(
    'User replacement operations are disabled. Load the User document and call save().',
  );
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
      match: EMAIL_REGEX,
    },

    phone: {
      type: String,
      default: undefined,
      set: normalizePhone,
      maxlength: 16,
      match: E164_REGEX,
    },

    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.PENDING,
    },

    emailVerifiedAt: {
      type: Date,
      default: null,
    },

    phoneVerifiedAt: {
      type: Date,
      default: null,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    strict: 'throw',
  },
);

// Validate activation requirements at the document level.
userSchema.pre('validate', function () {
  if (!isActivationAttempt(this)) return;

  for (const [path, message] of getActivationErrors(this)) {
    this.invalidate(path, message);
  }
});

// Keep activation protection even if a caller disables save-time validation.
userSchema.pre('save', function () {
  if (!isActivationAttempt(this)) return;

  const activationErrors = getActivationErrors(this);

  if (activationErrors.length === 0) return;

  const error = new mongoose.Error.ValidationError(this);

  for (const [path, message] of activationErrors) {
    error.addError(
      path,
      new mongoose.Error.ValidatorError({
        path,
        message,
        value: this.get(path),
      }),
    );
  }

  throw error;
});

// Do not permit query APIs to bypass the document activation lifecycle.
userSchema.pre('updateOne', preventQueryStatusUpdate);
userSchema.pre('updateMany', preventQueryStatusUpdate);
userSchema.pre('findOneAndUpdate', preventQueryStatusUpdate);
userSchema.pre('replaceOne', preventReplacement);
userSchema.pre('findOneAndReplace', preventReplacement);

// Keep email and phone reserved, including for soft-deleted accounts.
userSchema.index(
  { email: 1 },
  {
    unique: true,
    name: 'user_email_unique',
  },
);

userSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: {
      phone: { $type: 'string' },
    },
    name: 'user_phone_unique',
  },
);

const User = mongoose.model('User', userSchema);

export { USER_STATUS };
export default User;
