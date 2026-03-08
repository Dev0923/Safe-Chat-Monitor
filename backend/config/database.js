import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || '';

const getConnectionOptions = (connectionString) => {
  const options = {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4, // Force IPv4 to avoid IPv6 routing issues
  };

  // Atlas/SRV deployments generally require TLS.
  if (connectionString.startsWith('mongodb+srv://') || connectionString.includes('mongodb.net')) {
    options.tls = true;
    options.tlsAllowInvalidCertificates = true;
  }

  return options;
};

export const connectDB = async () => {
  try {
    if (!MONGO_URI) {
      console.error('❌ MONGO_URI is not set. Create backend/.env and provide your MongoDB connection string.');
      return false;
    }

    await mongoose.connect(MONGO_URI, getConnectionOptions(MONGO_URI));
    console.log('✅ MongoDB Atlas connected successfully.');
    return true;
  } catch (error) {
    const message = error?.message || '';
    const normalizedMessage = message.toLowerCase();

    console.error('❌ MongoDB connection failed:', message);
    if (normalizedMessage.includes('querysrv econnrefused')) {
      console.error('   → DNS query for Atlas SRV record was refused by this network DNS resolver.');
      console.error('   → Try switching DNS to 8.8.8.8 or 1.1.1.1, flush DNS cache, then retry.');
      console.error('   → As fallback, use Atlas non-SRV connection string in MONGO_URI.');
    } else if (message.includes('ECONNREFUSED')) {
      console.error('   → MongoDB server is not running or refusing connections.');
    } else if (normalizedMessage.includes('authentication failed')) {
      console.error('   → Wrong username or password in MONGO_URI.');
    } else if (normalizedMessage.includes('timed out') || message.includes('ETIMEDOUT')) {
      console.error('   → Connection timed out. Most likely your IP is not whitelisted in MongoDB Atlas.');
      console.error('   → Go to: https://cloud.mongodb.com → Network Access → Add IP Address → Allow Access From Anywhere (0.0.0.0/0)');
    } else if (message.includes('ENOTFOUND')) {
      console.error('   → Cannot resolve hostname. Check your internet connection or the MONGO_URI hostname.');
    } else if (normalizedMessage.includes('ssl') || normalizedMessage.includes('tls')) {
      console.error('   → SSL/TLS handshake failed. Your MongoDB Atlas cluster may be paused (free tier auto-pauses).');
      console.error('   → Go to: https://cloud.mongodb.com → Clusters → Resume cluster.');
    }
    return false;
  }
};

export default mongoose;
