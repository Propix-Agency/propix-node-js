/* import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';

import UserAuthenticationModel, {
  AUTHENTICATION_PROVIDERS,
  userAuthenticationSchema,
} from './user.authentication.model.js';

describe('UserAuthentication model', () => {
  const userId = new mongoose.Types.ObjectId();

  it('requires a reference to the shared User document', async () => {
    const authentication = new UserAuthenticationModel({});

    await expect(authentication.validate()).rejects.toMatchObject({
      errors: {
        userId: expect.objectContaining({ name: 'ValidatorError' }),
      },
    });
  });

  it('creates an authentication record with safe defaults', () => {
    const authentication = new UserAuthenticationModel({ userId });

    expect(authentication.userId).toEqual(userId);
    expect(authentication.passwordHash).toBeNull();
    expect(authentication.passwordChangedAt).toBeNull();
    expect(authentication.externalIdentities).toEqual([]);
    expect(authentication.lastAuthenticatedAt).toBeNull();
  });

  it('accepts a password hash without storing a plaintext password field', async () => {
    const authentication = new UserAuthenticationModel({
      userId,
      passwordHash: '$argon2id$example-hash',
      passwordChangedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    await expect(authentication.validate()).resolves.toBeUndefined();
    expect(userAuthenticationSchema.path('password')).toBeUndefined();
    expect(userAuthenticationSchema.path('passwordHash')).toBeDefined();
  });

  it('rejects an empty password hash', async () => {
    const authentication = new UserAuthenticationModel({
      userId,
      passwordHash: '',
    });

    await expect(authentication.validate()).rejects.toMatchObject({
      errors: {
        passwordHash: expect.objectContaining({ name: 'ValidatorError' }),
      },
    });
  });

  it('keeps the password hash excluded from normal query selection', () => {
    expect(userAuthenticationSchema.path('passwordHash')?.options.select).toBe(
      false,
    );
  });

  it('removes the password hash from JSON and object serialization', () => {
    const authentication = new UserAuthenticationModel({
      userId,
      passwordHash: '$argon2id$private-hash',
    });

    expect(authentication.toJSON()).not.toHaveProperty('passwordHash');
    expect(authentication.toObject()).not.toHaveProperty('passwordHash');
  });

  it('accepts the currently supported external identity providers', async () => {
    const authentication = new UserAuthenticationModel({
      userId,
      externalIdentities: [
        {
          provider: 'google',
          providerUserId: 'google-subject-123',
        },
        {
          provider: 'apple',
          providerUserId: 'apple-subject-456',
        },
      ],
    });

    await expect(authentication.validate()).resolves.toBeUndefined();
    expect(AUTHENTICATION_PROVIDERS).toEqual(['google', 'apple']);
    expect(authentication.externalIdentities).toHaveLength(2);
    expect(authentication.externalIdentities[0]?.linkedAt).toBeInstanceOf(Date);
  });

  it('rejects unsupported external identity providers', async () => {
    const authentication = new UserAuthenticationModel({
      userId,
      externalIdentities: [
        {
          provider: 'facebook',
          providerUserId: 'facebook-subject-123',
        },
      ],
    });

    await expect(authentication.validate()).rejects.toMatchObject({
      errors: {
        'externalIdentities.0.provider': expect.objectContaining({
          name: 'ValidatorError',
        }),
      },
    });
  });

  it('rejects empty provider user IDs', async () => {
    const authentication = new UserAuthenticationModel({
      userId,
      externalIdentities: [
        {
          provider: 'google',
          providerUserId: '   ',
        },
      ],
    });

    await expect(authentication.validate()).rejects.toBeInstanceOf(
      mongoose.Error.ValidationError,
    );
  });

  it('rejects duplicate external identities inside one authentication record', async () => {
    const authentication = new UserAuthenticationModel({
      userId,
      externalIdentities: [
        {
          provider: 'google',
          providerUserId: 'same-subject',
        },
        {
          provider: 'google',
          providerUserId: 'same-subject',
        },
      ],
    });

    await expect(authentication.validate()).rejects.toMatchObject({
      errors: {
        externalIdentities: expect.objectContaining({ name: 'ValidatorError' }),
      },
    });
  });

  it('defines unique indexes for the User relationship and provider identities', () => {
    const indexes = userAuthenticationSchema.indexes();

    expect(indexes).toEqual(
      expect.arrayContaining([
        [
          { userId: 1 },
          expect.objectContaining({
            unique: true,
            name: 'user_authentication_user_unique',
          }),
        ],
        [
          {
            'externalIdentities.provider': 1,
            'externalIdentities.providerUserId': 1,
          },
          expect.objectContaining({
            unique: true,
            name: 'user_authentication_external_identity_unique',
            partialFilterExpression: {
              'externalIdentities.provider': { $exists: true },
            },
          }),
        ],
      ]),
    );
  });

  it('does not put authentication credentials into the shared User schema', async () => {
    const { userSchema } = await import('./user.model.js');

    expect(userSchema.path('password')).toBeUndefined();
    expect(userSchema.path('passwordHash')).toBeUndefined();
    expect(userSchema.path('externalIdentities')).toBeUndefined();
  });

  it('rejects unknown authentication fields because strict throw is enabled', () => {
    expect(
      () =>
        new UserAuthenticationModel({
          userId,
          accessToken: 'must-not-be-stored',
        }),
    ).toThrow();
  });
});
 */