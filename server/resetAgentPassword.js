require('dotenv').config();
const { User } = require('./models');

async function resetAgentPassword() {
  try {
    // Find the agent user
    const agent = await User.findOne({
      where: { 
        username: 'agent',
        role: 'agent'
      }
    });

    if (!agent) {
      console.error('Agent user not found');
      process.exit(1);
    }

    // Update the password - will be hashed by model hooks
    await agent.update({ 
      password: '123456' // Will be hashed by beforeUpdate hook
    });

    console.log('Agent password has been reset successfully');
    console.log('Username: agent');
    console.log('New password: 123456');
    
    // Verify the password works
    const isValid = await agent.validatePassword('123456');
    console.log('Password validation test:', isValid);
    
    process.exit(0);
  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  }
}

resetAgentPassword();
