// PM2 process manager config (EC2 par server ko hamesha chalta rakhta hai).
// Start:  pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'fitcloud-api',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '300M',
      env: { NODE_ENV: 'production' },
    },
  ],
};
