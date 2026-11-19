import { describe, it, expect } from 'vitest';
import User, { USER_STATUS } from './user.model.js';

describe('User Model', () => {
  // ------------------------------------
  // 1. Default Values
  // ------------------------------------

  describe('Default Values', () => {
    it('should apply default values correctly', () => {
      const user = new User({
        email: 'test@gmail.com',
      });

      expect(user.status).toBe(USER_STATUS.PENDING);
      expect(user.emailVerifiedAt).toBeNull();
      expect(user.firstName).toBeUndefined();
      expect(user.lastName).toBeUndefined();
      expect(user.phone).toBeUndefined();
    });
  });

  // ------------------------------------
  // 2. Field Normalization
  // ------------------------------------

  describe('Field Normalization', () => {
    it('should trim and lowercase email', () => {
      const user = new User({
        email: '  TEST@GMAIL.COM  ',
      });

      expect(user.email).toBe('test@gmail.com');
    });

    it('should trim firstName and lastName', () => {
      const user = new User({
        email: 'test@gmail.com',
        firstName: '  Abed  ',
        lastName: '  Ali  ',
      });

      expect(user.firstName).toBe('Abed');
      expect(user.lastName).toBe('Ali');
    });

    it('should normalize phone number', () => {
      const user = new User({
        email: 'test@gmail.com',
        phone: ' +961 (70) 123-456 ',
      });

      expect(user.phone).toBe('+96170123456');
    });

    it('should remove non-digit characters from phone', () => {
      const user = new User({
        email: 'test@gmail.com',
        phone: '070-123.456',
      });

      expect(user.phone).toBe('070123456');
    });

    it('should preserve the plus prefix', () => {
      const user = new User({
        email: 'test@gmail.com',
        phone: '+96170123456',
      });

      expect(user.phone).toBe('+96170123456');
    });

    it('should remove empty phone values', () => {
      const user = new User({
        email: 'test@gmail.com',
        phone: '   ',
      });

      expect(user.phone).toBeUndefined();
    });
  });

  // ------------------------------------
  // 3. Required Fields
  // ------------------------------------

  describe('Required Fields', () => {
    it('should require email', async () => {
      const user = new User({});

      await expect(user.validate()).rejects.toMatchObject({
        errors: {
          email: expect.objectContaining({
            name: 'ValidatorError',
          }),
        },
      });
    });

    it('should reject an empty email', async () => {
      const user = new User({
        email: '   ',
      });

      await expect(user.validate()).rejects.toMatchObject({
        errors: {
          email: expect.anything(),
        },
      });
    });
  });

  // ------------------------------------
  // 4. String Length Validation
  // ------------------------------------

  describe('String Length Validation', () => {
    it('should reject firstName longer than 80 characters', async () => {
      const user = new User({
        email: 'test@gmail.com',
        firstName: 'A'.repeat(81),
      });

      await expect(user.validate()).rejects.toMatchObject({
        errors: {
          firstName: expect.anything(),
        },
      });
    });

    it('should reject lastName longer than 80 characters', async () => {
      const user = new User({
        email: 'test@gmail.com',
        lastName: 'A'.repeat(81),
      });

      await expect(user.validate()).rejects.toMatchObject({
        errors: {
          lastName: expect.anything(),
        },
      });
    });

    it('should reject empty firstName after trimming', async () => {
      const user = new User({
        email: 'test@gmail.com',
        firstName: '   ',
      });

      await expect(user.validate()).rejects.toMatchObject({
        errors: {
          firstName: expect.anything(),
        },
      });
    });

    it('should reject empty lastName after trimming', async () => {
      const user = new User({
        email: 'test@gmail.com',
        lastName: '   ',
      });

      await expect(user.validate()).rejects.toMatchObject({
        errors: {
          lastName: expect.anything(),
        },
      });
    });

    it('should reject email longer than 254 characters', async () => {
      const user = new User({
        email: `${'a'.repeat(243)}@gmail.com`,
      });

      await expect(user.validate()).rejects.toMatchObject({
        errors: {
          email: expect.anything(),
        },
      });
    });
  });

  // ------------------------------------
  // 5. Phone Validation
  // ------------------------------------

  describe('Phone Validation', () => {
    it.each(['1234', '1234567890123456', '+1234567890123456', 'abc'])(
      'should reject invalid phone: %s',
      async (phone) => {
        const user = new User({
          email: 'test@gmail.com',
          phone,
        });

        await expect(user.validate()).rejects.toMatchObject({
          errors: {
            phone: expect.anything(),
          },
        });
      },
    );

    it('should accept a valid international phone', async () => {
      const user = new User({
        email: 'test@gmail.com',
        phone: '+96170123456',
      });

      await expect(user.validate()).resolves.toBeUndefined();
    });
  });

  // ------------------------------------
  // 6. Status Validation
  // ------------------------------------

  describe('Status Validation', () => {
    it.each(Object.values(USER_STATUS))('should accept status: %s', async (status) => {
      const user = new User({
        email: 'test@gmail.com',
        status,
      });

      await expect(user.validate()).resolves.toBeUndefined();
    });

    it('should reject an invalid status', async () => {
      const user = new User({
        email: 'test@gmail.com',
        status: 'unknown',
      });

      await expect(user.validate()).rejects.toMatchObject({
        errors: {
          status: expect.anything(),
        },
      });
    });
  });

  // ------------------------------------
  // 7. Account Activation Requirements
  // ------------------------------------

  describe('Account Activation Requirements', () => {
    it('should reject activation without required fields', async () => {
      const user = new User({
        email: 'test@gmail.com',
        status: USER_STATUS.ACTIVE,
      });

      await expect(user.validate()).rejects.toMatchObject({
        errors: {
          firstName: expect.anything(),
          lastName: expect.anything(),
          phone: expect.anything(),
          emailVerifiedAt: expect.anything(),
        },
      });
    });

    it('should allow activation with all required fields', async () => {
      const user = new User({
        email: 'test@gmail.com',
        firstName: 'Abed',
        lastName: 'Ali',
        phone: '+96170123456',
        emailVerifiedAt: new Date(),
        status: USER_STATUS.ACTIVE,
      });

      await expect(user.validate()).resolves.toBeUndefined();
    });

    it('should not require activation fields for pending accounts', async () => {
      const user = new User({
        email: 'test@gmail.com',
        status: USER_STATUS.PENDING,
      });

      await expect(user.validate()).resolves.toBeUndefined();
    });

    it('should not require activation fields for suspended accounts', async () => {
      const user = new User({
        email: 'test@gmail.com',
        status: USER_STATUS.SUSPENDED,
      });

      await expect(user.validate()).resolves.toBeUndefined();
    });
  });

  // ------------------------------------
  // 8. Strict Mode
  // ------------------------------------

  describe('Strict Mode', () => {
    it('should reject unknown fields', () => {
      expect(() => {
        new User({
          email: 'test@gmail.com',
          unknownField: 'value',
        });
      }).toThrow();
    });
  });

  // ------------------------------------
  // 9. Indexes
  // ------------------------------------

  describe('Indexes', () => {
    const indexes = User.schema.indexes();

    it('should define a unique email index', () => {
      const emailIndex = indexes.find(([fields, options]) => options.name === 'uniq_users_email');

      expect(emailIndex).toBeDefined();
      expect(emailIndex[0]).toEqual({ email: 1 });
      expect(emailIndex[1].unique).toBe(true);
    });

    it('should define a partial unique phone index', () => {
      const phoneIndex = indexes.find(([fields, options]) => options.name === 'uniq_users_phone');

      expect(phoneIndex).toBeDefined();
      expect(phoneIndex[0]).toEqual({ phone: 1 });
      expect(phoneIndex[1].unique).toBe(true);

      expect(phoneIndex[1].partialFilterExpression).toEqual({
        phone: { $type: 'string' },
      });
    });
  });
});
