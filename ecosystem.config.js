module.exports = {
  apps: [
    {
      name: 'xuthority-backend',
      script: 'server.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 8081
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8081
      },
      // PM2 monitoring and management
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],
      max_memory_restart: '1G',
      
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // Health monitoring
      health_check_url: 'http://localhost:8081/api/v1/health',
      health_check_grace_period: 3000,
      
      // Advanced settings
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Environment specific settings
      node_args: '--max-old-space-size=1024',
      
      // Auto restart settings
      autorestart: true,
      
      // Cron restart (optional - restart daily at 2 AM)
      cron_restart: '0 2 * * *',
      
      // Merge logs
      merge_logs: true,
      
      // Time zone
      time: true
    }
  ]
};
