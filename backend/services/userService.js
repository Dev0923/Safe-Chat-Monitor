import { User } from '../models/index.js';

export const getUserById = async (userId) => {
  try {
    const user = await User.findById(userId);
    return user;
  } catch (error) {
    console.error('Get user by ID error:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    if (updates.name) user.name = updates.name;
    if (updates.profileImage !== undefined) user.profileImage = updates.profileImage;
    if (updates.emailAlertEnabled !== undefined) user.emailAlertEnabled = updates.emailAlertEnabled;
    if (updates.darkModeEnabled !== undefined) user.darkModeEnabled = updates.darkModeEnabled;

    await user.save();
    return user;
  } catch (error) {
    console.error('Update user profile error:', error);
    throw error;
  }
};

export const getUserSettings = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    return {
      emailAlertEnabled: user.emailAlertEnabled,
      darkModeEnabled: user.darkModeEnabled,
    };
  } catch (error) {
    console.error('Get user settings error:', error);
    throw error;
  }
};
