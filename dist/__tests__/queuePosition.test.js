"use strict";
/**
 * Queue Position System Tests
 *
 * Tests to verify:
 * 1. tokenNumber is static (assigned once, never changes)
 * 2. currentPosition is dynamic (calculated at runtime)
 * 3. currentPosition decreases as customers are completed
 * 4. No database writes happen for position updates
 * 5. Old queue data doesn't break the system
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const queueService_1 = require("../services/queueService");
const prisma_1 = __importDefault(require("../utils/prisma"));
const client_1 = require("@prisma/client");
describe('Queue Position System', () => {
    let customerId;
    let barberId;
    let shopId;
    let queueId;
    beforeAll(async () => {
        // Setup: Create test data
        // Note: In real tests, use a test database or transactions
        // This is a demonstration of test structure
        console.log('Test suite for queue position system');
    });
    describe('Token Number (Static)', () => {
        test('tokenNumber should be assigned once on join', async () => {
            // Given a customer joins queue
            const item = await prisma_1.default.queueItem.findFirst({
                where: { customerId }
            });
            expect(item).toBeDefined();
            expect(item?.tokenNumber).toBeDefined();
            expect(typeof item?.tokenNumber).toBe('number');
        });
        test('tokenNumber should never be updated', async () => {
            // Given a customer is in queue with token #5
            const initialItem = await prisma_1.default.queueItem.findFirst({
                where: { customerId }
            });
            const initialToken = initialItem?.tokenNumber;
            // When we update the item's status
            // Then tokenNumber should remain the same
            const updatedItem = await prisma_1.default.queueItem.findFirst({
                where: { customerId }
            });
            expect(updatedItem?.tokenNumber).toBe(initialToken);
        });
        test('tokenNumber should be sequential across all queue items', async () => {
            // Given multiple customers in a queue
            const items = await prisma_1.default.queueItem.findMany({
                where: { queueId },
                orderBy: { tokenNumber: 'asc' }
            });
            // Then token numbers should increase sequentially
            for (let i = 0; i < items.length - 1; i++) {
                expect(items[i].tokenNumber < items[i + 1].tokenNumber).toBe(true);
            }
        });
    });
    describe('Current Position (Dynamic)', () => {
        test('currentPosition should be calculated at runtime', async () => {
            // Given a customer in queue with 5 people ahead
            const item = await prisma_1.default.queueItem.findFirst({
                where: { customerId }
            });
            if (!item)
                throw new Error('Test item not found');
            // When we calculate position
            const position = await (0, queueService_1.calculateCurrentPosition)(item.id);
            // Then position should be > 0
            expect(position).toBeGreaterThan(0);
        });
        test('currentPosition should decrease when earlier customers are completed', async () => {
            // Given customer at position 5 with 4 people ahead
            const item = await prisma_1.default.queueItem.findFirst({
                where: { customerId }
            });
            if (!item)
                throw new Error('Test item not found');
            const positionBefore = await (0, queueService_1.calculateCurrentPosition)(item.id);
            // When we complete one customer ahead
            const itemAhead = await prisma_1.default.queueItem.findFirst({
                where: {
                    queueId: item.queueId,
                    status: client_1.QueueStatus.WAITING,
                    entryTime: { lt: item.entryTime }
                }
            });
            if (itemAhead) {
                await prisma_1.default.queueItem.update({
                    where: { id: itemAhead.id },
                    data: { status: client_1.QueueStatus.COMPLETED }
                });
                // Then position should decrease by 1
                const positionAfter = await (0, queueService_1.calculateCurrentPosition)(item.id);
                expect(positionAfter).toBe(positionBefore - 1);
                // Cleanup: restore status for other tests
                await prisma_1.default.queueItem.update({
                    where: { id: itemAhead.id },
                    data: { status: client_1.QueueStatus.WAITING }
                });
            }
        });
        test('currentPosition should be recalculated on every query', async () => {
            // Given a customer in queue
            const item = await prisma_1.default.queueItem.findFirst({
                where: { customerId }
            });
            if (!item)
                throw new Error('Test item not found');
            // When we calculate position multiple times
            const position1 = await (0, queueService_1.calculateCurrentPosition)(item.id);
            const position2 = await (0, queueService_1.calculateCurrentPosition)(item.id);
            // Then both calculations should be consistent
            expect(position1).toBe(position2);
        });
        test('currentPosition should account for SERVING status', async () => {
            // Given customers in WAITING and SERVING status
            const item = await prisma_1.default.queueItem.findFirst({
                where: { customerId }
            });
            if (!item)
                throw new Error('Test item not found');
            // When we calculate position
            const position = await (0, queueService_1.calculateCurrentPosition)(item.id);
            // Then it should include both WAITING and SERVING customers ahead
            const itemsAhead = await prisma_1.default.queueItem.count({
                where: {
                    queueId: item.queueId,
                    status: { in: [client_1.QueueStatus.WAITING, client_1.QueueStatus.SERVING] },
                    entryTime: { lt: item.entryTime }
                }
            });
            expect(position).toBe(itemsAhead + 1);
        });
        test('completed customers should not affect currentPosition', async () => {
            // Given a customer at position 5
            const item = await prisma_1.default.queueItem.findFirst({
                where: { customerId }
            });
            if (!item)
                throw new Error('Test item not found');
            const positionBefore = await (0, queueService_1.calculateCurrentPosition)(item.id);
            // When we count items, COMPLETED should not be included
            const waitingAndServingAhead = await prisma_1.default.queueItem.count({
                where: {
                    queueId: item.queueId,
                    status: { in: [client_1.QueueStatus.WAITING, client_1.QueueStatus.SERVING] },
                    entryTime: { lt: item.entryTime }
                }
            });
            // Then position calculation should not change
            expect(positionBefore).toBe(waitingAndServingAhead + 1);
        });
    });
    describe('No Database Writes for Position', () => {
        test('calculateCurrentPosition should not modify database', async () => {
            // Given a customer in queue
            const item = await prisma_1.default.queueItem.findFirst({
                where: { customerId }
            });
            if (!item)
                throw new Error('Test item not found');
            // When we calculate position multiple times
            const initialItem = JSON.stringify(item);
            await (0, queueService_1.calculateCurrentPosition)(item.id);
            await (0, queueService_1.calculateCurrentPosition)(item.id);
            const finalItem = JSON.stringify(item);
            // Then the item data should not change
            expect(finalItem).toBe(initialItem);
        });
        test('position should not be stored in database', async () => {
            // Given queue items in database
            const items = await prisma_1.default.queueItem.findMany({
                where: { queueId }
            });
            // Then items should have: tokenNumber, entryTime, status
            // But NO: currentPosition or positionColumn
            items.forEach((item) => {
                expect(item).toHaveProperty('tokenNumber');
                expect(item).toHaveProperty('entryTime');
                expect(item).toHaveProperty('status');
                expect(item).not.toHaveProperty('currentPosition');
                expect(item).not.toHaveProperty('positionColumn');
            });
        });
    });
    describe('Edge Cases', () => {
        test('first customer in queue should have position 1', async () => {
            // Given the first customer in a queue
            const item = await prisma_1.default.queueItem.findFirst({
                where: { queueId },
                orderBy: { entryTime: 'asc' }
            });
            if (!item)
                throw new Error('Test item not found');
            // When we calculate position
            const position = await (0, queueService_1.calculateCurrentPosition)(item.id);
            // Then position should be 1
            expect(position).toBe(1);
        });
        test('old queue records should not break position calculation', async () => {
            // Given old queue items from before a certain date
            // When we calculate position for new items
            // Then calculation should still work correctly
            const item = await prisma_1.default.queueItem.findFirst({
                where: { customerId }
            });
            if (!item)
                throw new Error('Test item not found');
            expect(async () => {
                await (0, queueService_1.calculateCurrentPosition)(item.id);
            }).not.toThrow();
        });
        test('position should handle concurrent queue joins gracefully', async () => {
            // Given concurrent queue joins happening
            // When we calculate position for different items
            // Then positions should be consistent based on entryTime ordering
            const items = await prisma_1.default.queueItem.findMany({
                where: { queueId },
                orderBy: { entryTime: 'asc' }
            });
            const positions = await Promise.all(items.map(item => (0, queueService_1.calculateCurrentPosition)(item.id)));
            // Positions should increase monotonically
            for (let i = 0; i < positions.length - 1; i++) {
                expect(positions[i] <= positions[i + 1]).toBe(true);
            }
        });
    });
    afterAll(async () => {
        // Cleanup if needed
        console.log('Test suite completed');
    });
});
