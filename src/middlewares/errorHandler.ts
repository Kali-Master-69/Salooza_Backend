import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const globalErrorHandler = (
    err: AppError | Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let error = err;

    if (!(error instanceof AppError)) {
        // Wrap unknown errors
        error = new AppError(err.message || 'Internal Server Error', 500);
    }

    const statusCode = (error as AppError).statusCode || 500;
    const status = (error as AppError).status || 'error';

    res.status(statusCode).json({
        status,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
};
