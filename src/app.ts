import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { globalErrorHandler } from './middlewares/errorHandler';
import { AppError } from './utils/AppError';

import authRoutes from './routes/authRoutes';
import queueRoutes from './routes/queueRoutes';
import serviceRoutes from './routes/serviceRoutes';
import availabilityRoutes from './routes/availabilityRoutes';
import chatRoutes from './routes/chatRoutes';
import shopRoutes from './routes/shopRoutes';
import teamRoutes from './routes/teamRoutes';

const app = express();

// Global Middlewares
app.use(helmet());
app.use(cors());
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}
app.use(express.json());

// Debug logging
app.use((req, res, next) => {
    console.log(`[SERVER DEBUG] ${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// Routes
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Server is running', version: '1.0.1' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/queue', queueRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/shops', shopRoutes);
app.use('/api/v1/team', teamRoutes);

// Mount availability routes directly under /api/v1 to avoid nesting issues
app.use('/api/v1', availabilityRoutes);

// 404
app.all(/(.*)/, (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error Handler
app.use(globalErrorHandler);

export default app;
