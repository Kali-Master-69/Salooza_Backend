"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const prisma_1 = __importDefault(require("./utils/prisma"));
const PORT = process.env.PORT || 4000;
const server = app_1.default.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});
process.on('SIGTERM', async () => {
    console.log('SIGTERM RECEIVED. Shutting down gracefully');
    await prisma_1.default.$disconnect();
    server.close(() => {
        console.log('Hyphen - Process terminated!');
    });
});
