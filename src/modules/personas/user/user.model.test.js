import { describe, it, expect } from 'vitest';
import User, { USER_STATUS } from './user.model.js';

const createVerifiedActiveUser = (overrides = {}) =>
  new User({
    email: 'test@example.com',
    firstName: 'Abed',
    lastName: 'Ali',
    emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
    status: USER_STATUS.ACTIVE,
    ...overrides,
  });

describe('User Model', () => {
  describe('Default Values', () => {
    it('applies account defaults correctly', () => {
      const user = new User({ email: 'test@example.com' });

      expect(user.status).toBe(USER_STATUS.PENDING);
      expect(user.emailVerifiedAt).toBeNull();
      expect(user.phoneVerifiedAt).toBeNull();
      expect(user.deletedAt).toBeNull();
      expect(user.firstName).toBeUndefined();
      expect(user.lastName).toBeUndefined();
      expect(user.phone).toBeUndefined();
    });
  });

  describe('Field Normalization', () => {
    it('trims and lowercases email', () => {
      const user = new User({ email: '  TEST@EXAMPLE.COM  ' });

      expect(user.email).toBe('test@example.com');
    });

    it('trims firstName and lastName', () => {
      const user = new User({
        email: 'test@example.com',
        firstName: '  Abed  ',
        lastName: '  Ali  ',
      });

      expect(user.firstName).toBe('Abed');
      expect(user.lastName).toBe('Ali');
    });

    it('normalizes an E.164 phone number with presentation characters', () => {
      const user = new User({
        email: 'test@example.com',
        phone: ' +961 (70) 123-456 ',
      });

      expect(user.phone).toBe('+96170123456');
    });

    it('converts an empty phone value to undefined', () => {
      const user = new User({
        email: 'test@example.com',
        phone: '   ',
      });

      expect(user.phone).toBeUndefined();
    });
  });

  describe('Required Fields and Email Validation', () => {
    it('requires email', async () => {
      const user = new User({});

      await expect(user.validate()).rejects.toMatchObject({
        errors: {
          email: expect.objectContaining({ name: 'ValidatorError' }),
        },
      });
    });

    it('rejects an empty email after trimming', async () => {
      const user = new User({ email: '   ' });

      await expect(user.validate()).rejects.toMatchObject({
        errors: { email: expect.anything() },
      });
    });

    it.each(['invalid-email', 'user@localhost', 'user name@example.com'])(
      'rejects invalid email: %s',
      async (email) => {
        const user = new User({ email });

        await expect(user.validate()).rejects.toMatchObject({
          errors: { email: expect.anything() },
        });
      },
    );

    it('rejects email longer than 254 characters', async () => {
      const user = new User({ email: `${'a'.repeat(243)}@example.com` });

      await expect(user.validate()).rejects.toMatchObject({
        errors: { email: expect.anything() },
      });
    });
  });

  describe('Name Validation', () => {
    it.each(['firstName', 'lastName'])(
      'rejects %s longer than 80 characters',
      async (field) => {
        const user = new User({
          email: 'test@example.com',
          [field]: 'A'.repeat(81),
        });

        await expect(user.validate()).rejects.toMatchObject({
          errors: { [field]: expect.anything() },
        });
      },
    );

    it.each(['firstName', 'lastName'])(
      'rejects an empty %s after trimming',
      async (field) => {
        const user = new User({
          email: 'test@example.com',
          [field]: '   ',
        });

        await expect(user.validate()).rejects.toMatchObject({
          errors: { [field]: expect.anything() },
        });
      },
    );
  });

  describe('Phone Validation', () => {
    it.each([
      '123456789',
      '070123456',
      '+0123456789',
      '+1234567890123456',
      '+961abc70123456',
      'abc',
    ])('rejects non-E.164 phone values: %s', async (phone) => {
      const user = new User({ email: 'test@example.com', phone });

      await expect(user.validate()).rejects.toMatchObject({
        errors: { phone: expect.anything() },
      });
    });

    it('accepts a valid E.164 phone number', async () => {
      const user = new User({
        email: 'test@example.com',
        phone: '+96170123456',
      });

      await expect(user.validate()).resolves.toBeUndefined();
    });

    it('allows phone to be absent', async () => {
      const user = new User({ email: 'test@example.com' });

      await expect(user.validate()).resolves.toBeUndefined();
    });
  });

  describe('Status Validation', () => {
    it.each(Object.values(USER_STATUS))('accepts status: %s', async (status) => {
      const user = new User({ email: 'test@example.com', status });

      await expect(user.validate()).resolves.toBeUndefined();
    });

    it('rejects an unknown status', async () => {
      const user = new User({ email: 'test@example.com', status: 'unknown' });

      await expect(user.validate()).rejects.toMatchObject({
        errors: { status: expect.anything() },
      });
    });
  });

  describe('Account Activation Requirements', () => {
    it('requires firstName, lastName, and verified email', async () => {
      const user = new User({
        email: 'test@example.com',
        status: USER_STATUS.ACTIVE,
      });

      await expect(user.validate()).rejects.toMatchObject({
        errors: {
          firstName: expect.anything(),
          lastName: expect.anything(),
          emailVerifiedAt: expect.anything(),
        },
      });
    });

    it('does not require a phone number to activate an account', async () => {
      const user = createVerifiedActiveUser();

      await expect(user.validate()).resolves.toBeUndefined();
    });

    it('does not require phone verification to activate an account', async () => {
      const user = createVerifiedActiveUser({ phone: '+96170123456' });

      await expect(user.validate()).resolves.toBeUndefined();
      expect(user.phoneVerifiedAt).toBeNull();
    });

    it('rejects activation of a soft-deleted account', async () => {
      const user = createVerifiedActiveUser({
        deletedAt: new Date('2026-01-02T00:00:00.000Z'),
      });

      await expect(user.validate()).rejects.toMatchObject({
        errors: { deletedAt: expect.anything() },
      });
    });

    it('allows pending accounts without activation data', async () => {
      const user = new User({
        email: 'test@example.com',
        status: USER_STATUS.PENDING,
      });

      await expect(user.validate()).resolves.toBeUndefined();
    });

    it('does not apply activation requirements to suspended accounts', async () => {
      const user = new User({
        email: 'test@example.com',
        status: USER_STATUS.SUSPENDED,
      });

      await expect(user.validate()).resolves.toBeUndefined();
    });

    it('does not apply activation requirements to disabled accounts', async () => {
      const user = new User({
        email: 'test@example.com',
        status: USER_STATUS.DISABLED,
      });

      await expect(user.validate()).resolves.toBeUndefined();
    });
  });

  describe('Query Update Protection', () => {
    it.each(['updateOne', 'updateMany', 'findOneAndUpdate'])(
      'blocks status changes through %s',
      async (method) => {
        const query = User[method]({}, { $set: { status: USER_STATUS.ACTIVE } });

        await expect(query.exec()).rejects.toThrow(
          'User status cannot be changed through query updates.',
        );
      },
    );

    it.each(['replaceOne', 'findOneAndReplace'])(
      'blocks replacement operations through %s',
      async (method) => {
        const query = User[method]({}, { email: 'replacement@example.com' });

        await expect(query.exec()).rejects.toThrow(
          'User replacement operations are disabled.',
        );
      },
    );
  });

  describe('Strict Mode and Schema Options', () => {
    it('rejects unknown fields', () => {
      expect(
        () => new User({ email: 'test@example.com', unknownField: 'value' }),
      ).toThrow();
    });

    it('enables timestamps and strict throw mode', () => {
      expect(User.schema.options.timestamps).toBe(true);
      expect(User.schema.options.strict).toBe('throw');
    });
  });

  describe('Indexes', () => {
    const indexes = User.schema.indexes();

    it('defines the documented unique email index', () => {
      const emailIndex = indexes.find(
        ([, options]) => options.name === 'user_email_unique',
      );

      expect(emailIndex).toBeDefined();
      expect(emailIndex[0]).toEqual({ email: 1 });
      expect(emailIndex[1].unique).toBe(true);
    });

    it('defines the documented partial unique phone index', () => {
      const phoneIndex = indexes.find(
        ([, options]) => options.name === 'user_phone_unique',
      );

      expect(phoneIndex).toBeDefined();
      expect(phoneIndex[0]).toEqual({ phone: 1 });
      expect(phoneIndex[1].unique).toBe(true);
      expect(phoneIndex[1].partialFilterExpression).toEqual({
        phone: { $type: 'string' },
      });
    });
  });
});
