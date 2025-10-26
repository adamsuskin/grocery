/**
 * Notification Routes
 *
 * API routes for push notification management
 */

import { Router } from 'express';
import { authenticate } from '../auth/middleware';
import { subscribe, unsubscribe, sendTestNotification } from './controller';

const router = Router();

/**
 * All notification routes require authentication
 */
router.use(authenticate);

/**
 * POST /api/notifications/subscribe
 * Subscribe to push notifications
 *
 * Body:
 * {
 *   subscription: PushSubscriptionData
 * }
 */
router.post('/subscribe', subscribe);

/**
 * POST /api/notifications/unsubscribe
 * Unsubscribe from push notifications
 *
 * Body:
 * {
 *   endpoint: string
 * }
 */
router.post('/unsubscribe', unsubscribe);

/**
 * POST /api/notifications/test
 * Send a test notification to the authenticated user
 */
router.post('/test', sendTestNotification);

export default router;
