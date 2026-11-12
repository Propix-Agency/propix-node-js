/* import { beforeEach, describe, expect, it, vi } from 'vitest';

import UserModel from './user.model.js';
import { activateUser } from './user.service.js';

describe('activateUser', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('activates a complete pending account through document save', async () => {
    const user = new UserModel({
      firstName: 'Abed',
      lastName: 'Slayman',
      email: 'abed@example.com',
      phone: '+96170123456',
      emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const saveSpy = vi.spyOn(user, 'save').mockResolvedValue(user);
    vi.spyOn(UserModel, 'findById').mockImplementation(
      (() => Promise.resolve(user)) as never,
    );

    const result = await activateUser(String(user._id));

    expect(result.status).toBe('active');
    expect(saveSpy).toHaveBeenCalledOnce();
  });

  it('rejects activation when the account does not exist', async () => {
    vi.spyOn(UserModel, 'findById').mockImplementation(
      (() => Promise.resolve(null)) as never,
    );

    await expect(activateUser('missing-user-id')).rejects.toThrow(
      'User account was not found.',
    );
  });

  it('rejects activation for a deleted account', async () => {
    const user = new UserModel({
      email: 'deleted@example.com',
      deletedAt: new Date(),
    });

    vi.spyOn(UserModel, 'findById').mockImplementation(
      (() => Promise.resolve(user)) as never,
    );

    await expect(activateUser(String(user._id))).rejects.toThrow(
      'A deleted account cannot be activated.',
    );
  });

  it('rejects activation unless the account is pending', async () => {
    const user = new UserModel({
      email: 'disabled@example.com',
      status: 'disabled',
    });

    vi.spyOn(UserModel, 'findById').mockImplementation(
      (() => Promise.resolve(user)) as never,
    );

    await expect(activateUser(String(user._id))).rejects.toThrow(
      'Only pending accounts can be activated.',
    );
  });

  it('does not save an account that fails activation validation', async () => {
    const user = new UserModel({ email: 'incomplete@example.com' });
    const saveSpy = vi.spyOn(user, 'save');

    vi.spyOn(UserModel, 'findById').mockImplementation(
      (() => Promise.resolve(user)) as never,
    );

    await expect(activateUser(String(user._id))).rejects.toMatchObject({
      name: 'ValidationError',
    });
    expect(saveSpy).toHaveBeenCalledOnce();
  });
});
 */