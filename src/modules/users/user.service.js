import UserModel, { type UserDocument } from './user.model.js';

/**
 * Activates a pending account after validating the complete user document.
 * Query-based updates are intentionally blocked from setting status=active.
 */
export const activateUser = async (userId: string): Promise<UserDocument> => {
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new Error('User account was not found.');
  }

  if (user.deletedAt) {
    throw new Error('A deleted account cannot be activated.');
  }

  if (user.status !== 'pending') {
    throw new Error('Only pending accounts can be activated.');
  }

  user.status = 'active';

  // save() validates all required fields against the complete document.
  await user.save();

  return user;
};

export default { activateUser };
