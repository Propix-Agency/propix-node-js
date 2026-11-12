import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';

import UserModel, { USER_STATUSES, userSchema } from './user.model.js';

describe('User model', () => {
  it('creates a pending account with safe verification and deletion defaults', () => {
    const user = new UserModel({ email: '  USER@Example.COM ' });

    expect(user.status).toBe('pending');
    expect(user.email).toBe('user@example.com');
    expect(user.emailVerifiedAt).toBeNull();
    expect(user.phoneVerifiedAt).toBeNull();
    expect(user.deletedAt).toBeNull();
  });

  it('allows an incomplete pending account', async () => {
    const user = new UserModel({ email: 'pending@example.com' });

    await expect(user.validate()).resolves.toBeUndefined();
  });

  it('requires an email address', async () => {
    const user = new UserModel({});

    await expect(user.validate()).rejects.toMatchObject({
      errors: {
        email: expect.objectContaining({ name: 'ValidatorError' }),
      },
    });
  });

  it('rejects malformed email addresses', async () => {
    const user = new UserModel({ email: 'not-an-email' });

    await expect(user.validate()).rejects.toMatchObject({
      errors: {
        email: expect.objectContaining({ name: 'ValidatorError' }),
      },
    });
  });

  it('requires names, phone, and verified email before activation', async () => {
    const user = new UserModel({
      email: 'pending@example.com',
      status: 'active',
    });

    await expect(user.validate()).rejects.toMatchObject({
      errors: {
        firstName: expect.objectContaining({ name: 'ValidatorError' }),
        lastName: expect.objectContaining({ name: 'ValidatorError' }),
        phone: expect.objectContaining({ name: 'ValidatorError' }),
        emailVerifiedAt: expect.objectContaining({ name: 'ValidatorError' }),
      },
    });
  });

  it('allows activation without phone verification once required data is complete', async () => {
    const user = new UserModel({
      firstName: 'Abed',
      lastName: 'Slayman',
      email: 'abed@example.com',
      phone: '+96170123456',
      status: 'active',
      emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    await expect(user.validate()).resolves.toBeUndefined();
    expect(user.phoneVerifiedAt).toBeNull();
  });

  it('requires phone numbers to use E.164 format when supplied', async () => {
    const user = new UserModel({
      email: 'pending@example.com',
      phone: '70123456',
    });

    await expect(user.validate()).rejects.toMatchObject({
      errors: {
        phone: expect.objectContaining({ name: 'ValidatorError' }),
      },
    });
  });

  it('accepts only the defined account statuses', async () => {
    const user = new UserModel({
      email: 'pending@example.com',
      status: 'unknown',
    });

    await expect(user.validate()).rejects.toMatchObject({
      errors: {
        status: expect.objectContaining({ name: 'ValidatorError' }),
      },
    });

    expect(USER_STATUSES).toEqual([
      'pending',
      'active',
      'suspended',
      'disabled',
    ]);
  });

  it('defines unique indexes for email and supplied phone numbers', () => {
    const indexes = userSchema.indexes();

    expect(indexes).toEqual(
      expect.arrayContaining([
        [
          { email: 1 },
          expect.objectContaining({ unique: true, name: 'user_email_unique' }),
        ],
        [
          { phone: 1 },
          expect.objectContaining({
            unique: true,
            name: 'user_phone_unique',
            partialFilterExpression: { phone: { $type: 'string' } },
          }),
        ],
      ]),
    );
  });

  it('does not store authentication credentials or role assignments', () => {
    expect(userSchema.path('password')).toBeUndefined();
    expect(userSchema.path('passwordHash')).toBeUndefined();
    expect(userSchema.path('roles')).toBeUndefined();
    expect(userSchema.path('googleId')).toBeUndefined();
    expect(userSchema.path('appleId')).toBeUndefined();
  });

  it('blocks query updates that attempt to activate an account', async () => {
    await expect(
      UserModel.updateOne(
        { _id: new mongoose.Types.ObjectId() },
        { $set: { status: 'active' } },
      ).exec(),
    ).rejects.toThrow(
      'Accounts must be activated through the user service, not query updates.',
    );
  });
});
