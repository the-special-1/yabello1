module.exports = {
  apps: [{
    name: 'index',
    script: './index.js',
    env_production: {
      NODE_ENV: 'production',
    },
  }],
};
