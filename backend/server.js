import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Initialize & verify local SQLite database
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`[VMS Server] Running in production mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('[VMS Startup Failure]:', error);
    process.exit(1);
  }
}

startServer();
