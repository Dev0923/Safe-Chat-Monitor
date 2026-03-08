import { User, Child } from '../models/index.js';
import { generateToken } from '../middleware/auth.js';

export const register = async (registerRequest) => {
  try {
    const { email, password, fullName, role } = registerRequest;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return {
        success: false,
        message: 'Email already registered',
      };
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      name: fullName,
      role: role || 'PARENT',
    });

    // Generate token
    const token = generateToken(user._id, user.email, user.role);

    // If child, get childId
    let childId = null;
    if (user.role === 'CHILD') {
      const child = await Child.findOne({ userId: user._id });
      if (child) {
        childId = child._id.toString();
      }
    }

    return {
      success: true,
      message: 'Registration successful',
      token,
      id: user._id,
      childId: childId,
      email: user.email,
      name: user.name,
      role: 'ROLE_' + user.role,
    };
  } catch (error) {
    console.error('Registration error:', error);
    let message = 'Registration failed. Please try again.';
    if (error.message?.includes('SSL') || error.message?.includes('TLS') || error.message?.includes('ssl')) {
      message = 'Cannot connect to the database. Please try again in a moment.';
    } else if (error.message?.includes('ETIMEDOUT') || error.message?.includes('timed out')) {
      message = 'Database connection timed out. Please try again later.';
    }
    return {
      success: false,
      message,
    };
  }
};

export const login = async (loginRequest) => {
  try {
    const { email, password } = loginRequest;

    // Find user by email (include password for comparison)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password',
      };
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return {
        success: false,
        message: 'Invalid email or password',
      };
    }

    // Generate token
    const token = generateToken(user._id, user.email, user.role);

    // If child, record login time and get childId
    let childId = null;
    if (user.role === 'CHILD') {
      const child = await Child.findOneAndUpdate(
        { userId: user._id },
        { lastLoginTime: new Date() },
        { new: true }
      );
      if (child) {
        childId = child._id.toString();
      }
    }

    return {
      success: true,
      message: 'Login successful',
      token,
      id: user._id,
      childId: childId,
      email: user.email,
      name: user.name,
      role: 'ROLE_' + user.role,
    };
  } catch (error) {
    console.error('Login error:', error);
    // Translate raw DB/SSL errors into a user-friendly message
    let message = 'Login failed. Please try again.';
    if (error.message?.includes('SSL') || error.message?.includes('TLS') || error.message?.includes('ssl')) {
      message = 'Cannot connect to the database. The server may be temporarily unavailable — please try again in a moment.';
    } else if (error.message?.includes('ETIMEDOUT') || error.message?.includes('timed out')) {
      message = 'Database connection timed out. Please check server status and try again.';
    } else if (error.message?.includes('ECONNREFUSED')) {
      message = 'Database server is not reachable. Please try again later.';
    }
    return {
      success: false,
      message,
    };
  }
};

export const updatePassword = async (userId, oldPassword, newPassword) => {
  try {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // Validate old password
    const isValidPassword = await user.validatePassword(oldPassword);
    if (!isValidPassword) {
      return {
        success: false,
        message: 'Current password is incorrect',
      };
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    return {
      success: true,
      message: 'Password updated successfully',
    };
  } catch (error) {
    console.error('Password update error:', error);
    return {
      success: false,
      message: 'Password update failed: ' + error.message,
    };
  }
};
