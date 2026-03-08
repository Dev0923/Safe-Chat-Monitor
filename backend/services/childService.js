import { Child } from '../models/index.js';
import User from '../models/User.js';
import * as notificationService from './notificationService.js';

export const getChildrenByParentId = async (parentId) => {
  try {
    const children = await Child.find({ parentId })
      .populate('parentId', 'id name email')
      .sort({ createdAt: -1 });
    return children;
  } catch (error) {
    console.error('Get children by parent ID error:', error);
    throw error;
  }
};

export const getChildById = async (childId, parentId) => {
  try {
    const child = await Child.findOne({ _id: childId, parentId });
    return child;
  } catch (error) {
    console.error('Get child by ID error:', error);
    throw error;
  }
};

export const createChild = async (childData, parentId) => {
  try {
    const child = await Child.create({
      ...childData,
      parentId,
      lastActivityTime: new Date(),
    });
    
    // Create account change notification
    await notificationService.createAccountNotification(
      parentId,
      child._id,
      child.name,
      `New child profile added: ${child.name}.`,
      { action: 'child_added', ageGroup: child.ageGroup }
    ).catch(err => console.error('Error creating notification:', err));
    
    return child;
  } catch (error) {
    console.error('Create child error:', error);
    throw error;
  }
};

export const updateChild = async (childId, parentId, updates) => {
  try {
    const child = await Child.findOne({ _id: childId, parentId });

    if (!child) throw new Error('Child not found');

    if (updates.name) child.name = updates.name;
    if (updates.ageGroup) child.ageGroup = updates.ageGroup;
    if (updates.active !== undefined) child.active = updates.active;

    await child.save();
    return child;
  } catch (error) {
    console.error('Update child error:', error);
    throw error;
  }
};

export const deleteChild = async (childId, parentId) => {
  try {
    const child = await Child.findOne({ _id: childId, parentId });

    if (!child) throw new Error('Child not found');
    
    const childName = child.name;
    await child.deleteOne();
    
    // Create account change notification
    await notificationService.createAccountNotification(
      parentId,
      null,
      childName,
      `Child profile removed: ${childName}.`,
      { action: 'child_removed' }
    ).catch(err => console.error('Error creating notification:', err));
    
    return true;
  } catch (error) {
    console.error('Delete child error:', error);
    throw error;
  }
};

export const linkChildByCredentials = async (email, password, parentId, ageGroup) => {
  // Find the user with given email
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) throw new Error('No account found with this email address');

  // Validate password
  const valid = await user.validatePassword(password);
  if (!valid) throw new Error('Incorrect password');

  // Ensure the account is a CHILD role
  if (user.role !== 'CHILD') throw new Error('This account is not registered as a child');

  // Check if already linked to this parent
  const existing = await Child.findOne({ userId: user._id, parentId });
  if (existing) throw new Error('This child is already added to your account');

  // Create the child record linked to the user account
  const child = await Child.create({
    name: user.name,
    ageGroup: ageGroup || 10,
    parentId,
    userId: user._id,
    lastActivityTime: new Date(),
  });
  
  // Create account change notification
  await notificationService.createAccountNotification(
    parentId,
    child._id,
    child.name,
    `New child account linked: ${child.name}.`,
    { action: 'child_linked', email: user.email }
  ).catch(err => console.error('Error creating notification:', err));

  return child;
};
