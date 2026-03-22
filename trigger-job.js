#!/usr/bin/env node

const Redis = require('ioredis');
const { Queue } = require('bullmq');

const redis = new Redis({
  host: 'localhost',
  port: 6379,
});

const cloneQueue = new Queue('repo-clone', { connection: redis });

(async () => {
  try {
    const job = await cloneQueue.add(
      'clone',
      {
        repositoryId: 'f593dbc6-e3a3-4555-ac7a-7fc1b48e659a',
        userId: 'default-user',
        cloneUrl: 'https://github.com/Charan-1810/CC_LAB-6.git',
        branch: 'main',
        githubToken: null,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      }
    );
    
    console.log('Job created:', job.id);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
