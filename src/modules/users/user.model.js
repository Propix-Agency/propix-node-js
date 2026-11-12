import mongoose, {
  type HydratedDocument,
  type Model,
  Schema,
} from 'mongoose';

/**
 * The lifecycle states of a Propix user account.
 *
 * `pending` accounts may still be completing their profile or verification.
 * Only backend-controlled onboarding logic should move an account to `active`.
 */
export const USER_STATUSES = [
  'pending',
  'active',
  'suspended',
  'disabled',
] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

/**
 * Data shared by every Propix user, independently of their role profiles
 * and authentication methods.
 */
export interface User {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  deletedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserDocument = HydratedDocument<User>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_PHONE_PATTERN = /^\+[1-9]\d{1,14}$/;

const userSchema = new Schema<User, Model<User>>(
  {
    firstName: {
      type: String,
      trim: true,
      maxlength: [80, 'First name cannot exceed 80 characters.'],
      required: [
        function (this: HydratedDocument<User>) {
          return this.status === 'active';
        },
        'First name is required before activating the account.',
      ],
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [80, 'Last name cannot exceed 80 characters.'],
      required: [
        function (this: HydratedDocument<User>) {
          return this.status === 'active';
        },
        'Last name is required before activating the account.',
      ],
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      trim: true,
      lowercase: true,
      maxlength: [254, 'Email cannot exceed 254 characters.'],
      match: [EMAIL_PATTERN, 'Please provide a valid email address.'],
    },
    phone: {
      type: String,
      trim: true,
      match: [E164_PHONE_PATTERN, 'Phone must use the E.164 format.'],
      required: [
        function (this: HydratedDocument<User>) {
          return this.status === 'active';
        },
        'Phone is required before activating the account.',
      ],
    },
    status: {
      type: String,
      enum: {
        values: USER_STATUSES,
        message: 'Invalid user account status.',
      },
      default: 'pending',
      required: true,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
      required: [
        function (this: HydratedDocument<User>) {
          return this.status === 'active';
        },
        'Email must be verified before activating the account.',
      ],
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


/**
 * Query updates cannot activate an account. Activation must go through
 * user.service.ts so the complete document is loaded and validated by save().
 */
const containsActiveStatus = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.some(containsActiveStatus);
  }

  if (value === null || typeof value !== 'object') {
    return false;
  }

  return Object.entries(value).some(
    ([key, nestedValue]) =>
      (key === 'status' && nestedValue === 'active') ||
      containsActiveStatus(nestedValue),
  );
};

const preventQueryActivation = (update: unknown): void => {
  if (containsActiveStatus(update)) {
    throw new Error(
      'Accounts must be activated through the user service, not query updates.',
    );
  }
};

userSchema.pre('updateOne', function () {
  preventQueryActivation(this.getUpdate());
});

userSchema.pre('updateMany', function () {
  preventQueryActivation(this.getUpdate());
});

userSchema.pre('findOneAndUpdate', function () {
  preventQueryActivation(this.getUpdate());
});

userSchema.pre('replaceOne', function () {
  preventQueryActivation(this.getUpdate());
});

userSchema.pre('findOneAndReplace', function () {
  preventQueryActivation(this.getUpdate());
});

// Unique indexes intentionally include soft-deleted accounts. Email and phone
// remain reserved until a separate, approved permanent-deletion policy exists.
userSchema.index(
  { email: 1 },
  { unique: true, name: 'user_email_unique' },
);

// Pending social accounts may not have a phone number yet. The partial index
// enforces uniqueness only when a phone string has actually been supplied.
userSchema.index(
  { phone: 1 },
  {
    unique: true,
    name: 'user_phone_unique',
    partialFilterExpression: { phone: { $type: 'string' } },
  },
);

const UserModel =
  (mongoose.models.User as Model<User> | undefined) ??
  mongoose.model<User>('User', userSchema);

export { userSchema };
export default UserModel;
