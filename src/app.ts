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
// Import other routes later

const app = express();

// Global Middlewares
app.use(helmet());
app.use(cors());
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/queue', queueRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/availability', availabilityRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/shops', shopRoutes);

// 404
app.all(/(.*)/, (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error Handler
app.use(globalErrorHandler);

export default app;
