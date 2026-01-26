"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const errorHandler_1 = require("./middlewares/errorHandler");
const AppError_1 = require("./utils/AppError");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const queueRoutes_1 = __importDefault(require("./routes/queueRoutes"));
const serviceRoutes_1 = __importDefault(require("./routes/serviceRoutes"));
const availabilityRoutes_1 = __importDefault(require("./routes/availabilityRoutes"));
const chatRoutes_1 = __importDefault(require("./routes/chatRoutes"));
const shopRoutes_1 = __importDefault(require("./routes/shopRoutes"));
const teamRoutes_1 = __importDefault(require("./routes/teamRoutes"));
const app = (0, express_1.default)();
// Global Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
app.use(express_1.default.json());
// Routes
app.use('/api/v1/auth', authRoutes_1.default);
app.use('/api/v1/queue', queueRoutes_1.default);
app.use('/api/v1/services', serviceRoutes_1.default);
app.use('/api/v1/availability', availabilityRoutes_1.default);
app.use('/api/v1/chat', chatRoutes_1.default);
app.use('/api/v1/shops', shopRoutes_1.default);
app.use('/api/v1/team', teamRoutes_1.default);
// 404
app.all(/(.*)/, (req, res, next) => {
    next(new AppError_1.AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
// Error Handler
app.use(errorHandler_1.globalErrorHandler);
exports.default = app;
