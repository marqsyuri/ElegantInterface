// Script to check and fix admin users in the database
import { db } from './server/db.ts';
import { users } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

async function checkAdminUsers() {
  try {
    console.log('Checking admin users...');
    
    // Get all users with role 'admin'
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'));
    
    console.log(`Found ${adminUsers.length} admin users:`);
    
    adminUsers.forEach(user => {
      console.log({
        id: user.id,
        username: user.username,
        role: user.role,
        parentUserId: user.parentUserId,
        parentUserIdType: typeof user.parentUserId,
        isNull: user.parentUserId === null,
        isUndefined: user.parentUserId === undefined
      });
    });
    
    // Check for admin users with parentUserId set (should be null)
    const adminsWithParent = adminUsers.filter(u => u.parentUserId !== null && u.parentUserId !== undefined);
    
    if (adminsWithParent.length > 0) {
      console.log(`\n⚠️  Found ${adminsWithParent.length} admin users with parentUserId set (should be null):`);
      adminsWithParent.forEach(user => {
        console.log(`  - ${user.username} (ID: ${user.id}) has parentUserId: ${user.parentUserId}`);
      });
      
      console.log('\nFixing admin users...');
      for (const user of adminsWithParent) {
        await db
          .update(users)
          .set({ parentUserId: null })
          .where(eq(users.id, user.id));
        console.log(`  ✅ Fixed ${user.username}`);
      }
    } else {
      console.log('\n✅ All admin users have parentUserId = null');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAdminUsers();

