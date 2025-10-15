import cron from 'node-cron';
import { storage } from './storage';

export function initializeScheduler() {
  // Schedule task to run daily at 00:00 (midnight)
  // Format: second minute hour day month weekday
  // '0 0 * * *' = At 00:00 every day
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('[Scheduler] Running inactive clients detection task at', new Date().toISOString());
      
      // Populate inactive clients table for all users
      await storage.populateAllUsersInactiveClients();
      
      console.log('[Scheduler] Inactive clients detection task completed successfully');
    } catch (error) {
      console.error('[Scheduler] Error running inactive clients detection task:', error);
    }
  }, {
    timezone: "America/Sao_Paulo" // Brazilian timezone
  });

  console.log('[Scheduler] Inactive clients detection task scheduled to run daily at 00:00 (midnight)');
}
