"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const AppError_1 = require("../utils/AppError");
const globalErrorHandler = (err, req, res, next) => {
    let error = err;
    if (!(error instanceof AppError_1.AppError)) {
        // Wrap unknown errors
        error = new AppError_1.AppError(err.message || 'Internal Server Error', 500);
    }
    const statusCode = error.statusCode || 500;
    const status = error.status || 'error';
    res.status(statusCode).json({
        status,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
};
exports.globalErrorHandler = globalErrorHandler;
