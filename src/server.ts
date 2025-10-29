import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Database } from './db/database';
import { createTaskRouter } from './routes/tasks';
import { createSyncRouter } from './routes/sync';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();

// ✅ Always use Render's dynamic PORT
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
const db = new Database(process.env.DATABASE_URL || './data/tasks.sqlite3');

// Routes
app.use('/api/tasks', createTaskRouter(db));
app.use('/api/sync', createSyncRouter(db));

// Default route to avoid 404 at root
app.get('/', (_req, res) => {
  res.send('✅ Backend is running successfully on Render!');
});

// Error handling
app.use(errorHandler);

// Start server immediately
(async () => {
  try {
    await db.initialize();
    console.log('✅ Database initialized');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await db.close();
  process.exit(0);
});
