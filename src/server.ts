import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import prisma from './utils/prisma';

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.on('unhandledRejection', (err: any) => {
    console.log('UNHANDLED REJECTION! Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

process.on('SIGTERM', async () => {
    console.log('SIGTERM RECEIVED. Shutting down gracefully');
    await prisma.$disconnect();
    server.close(() => {
        console.log('Hyphen - Process terminated!');
    });
});
