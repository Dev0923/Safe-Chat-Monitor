import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name:               { type: String, required: true },
  email:              { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:           { type: String, required: true },
  role:               { type: String, enum: ['PARENT', 'CHILD', 'ADMIN'], default: 'PARENT' },
  profileImage:       { type: String, default: null },
  emailAlertEnabled:  { type: Boolean, default: true },
  darkModeEnabled:    { type: Boolean, default: false },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Validate password
userSchema.methods.validatePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

// Strip password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
