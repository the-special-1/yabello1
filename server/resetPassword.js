require('dotenv').config();
const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function resetSuperadminPassword() {
  try {
    // Find the superadmin user
    const superadmin = await User.findOne({
      where: { 
        username: 'superadmin',
        role: 'superadmin'
      }
    });

    if (!superadmin) {
      console.error('Superadmin user not found');
      process.exit(1);
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash('1234', 10);

    // Update the password
    await superadmin.update({ password: hashedPassword });

    console.log('Superadmin password has been reset successfully');
    console.log('Username: superadmin');
    console.log('New password: 1234');
    
    process.exit(0);
  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  }
}

resetSuperadminPassword();
