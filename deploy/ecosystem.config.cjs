module.exports = {
  apps: [
    {
      name: 'interviewer-backend',
      cwd: '/var/www/interviewer/backend',
      script: 'dist/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: '8040',
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
    },
    {
      name: 'interviewer-job-seeker',
      cwd: '/var/www/interviewer/job-seeker-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3040',
      env: {
        NODE_ENV: 'production',
        PORT: '3040',
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
    },
    {
      name: 'interviewer-company',
      cwd: '/var/www/interviewer/company-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3041',
      env: {
        NODE_ENV: 'production',
        PORT: '3041',
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
    },
  ],
};
