import cron from 'node-cron';
import { storage } from './storage';

export function initializeScheduler() {
  // Schedule task to run daily at 00:00 (midnight) - Inactive Clients
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

  // Schedule task to run every hour - Appointment Reminders
  // '0 * * * *' = At minute 0 of every hour
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('[Scheduler] Running appointment reminders task at', new Date().toISOString());
      
      // Populate appointment reminders table for all users
      await storage.populateAllUsersAppointmentReminders();
      
      console.log('[Scheduler] Appointment reminders task completed successfully');
    } catch (error) {
      console.error('[Scheduler] Error running appointment reminders task:', error);
    }
  }, {
    timezone: "America/Sao_Paulo" // Brazilian timezone
  });

  console.log('[Scheduler] Inactive clients detection task scheduled to run daily at 00:00 (midnight)');
  console.log('[Scheduler] Appointment reminders task scheduled to run every hour at :00');
}
