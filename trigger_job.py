#!/usr/bin/env python3
import json
import subprocess
import time
import uuid
from datetime import datetime

# Job data
repo_id = 'f593dbc6-e3a3-4555-ac7a-7fc1b48e659a'
job_id = str(uuid.uuid4())
queue_name = 'bull:repo-clone'

# Create the job object
job_data = {
    'data': {
        'repositoryId': repo_id,
        'userId': 'default-user',
        'cloneUrl': 'https://github.com/Charan-1810/CC_LAB-6.git',
        'branch': 'main',
        'githubToken': None,
    },
    'opts': {
        'attempts': 3,
        'backoff': {
            'type': 'exponential',
            'delay': 5000
        },
        'removeOnComplete': {
            'count': 100
        },
        'priority': None,
        'repeat': None,
        'timestamp': int(datetime.now().timestamp() * 1000),
    },
    'status': 'waiting',
    'name': 'clone',
    'progress': 0,
    'attempts': 0,
    'isFailed': False,
    'isCompleted': False,
    'isDelayed': False,
    'isWaiting': True,
    'isActive': False,
    'isStalled': False,
    'parent': None,
    'stacktrace': [],
    'returnvalue': None,
    'failedReason': None,
}

# Serialize as JSON
job_json = json.dumps(job_data, separators=(',', ':'), default=str)

# Add to job set
cmd = f'docker exec ai-codebase-explainer-redis-1 redis-cli SET "{queue_name}:{job_id}" {repr(job_json)}'
print(f"Adding job to Redis...")
subprocess.run(cmd, shell=True, check=True)

# Add to waitlist (sorted set with score 0)
cmd = f'docker exec ai-codebase-explainer-redis-1 redis-cli ZADD "{queue_name}:wait" 0 {job_id}'
subprocess.run(cmd, shell=True, check=True)

# Increment job counter
cmd = f'docker exec ai-codebase-explainer-redis-1 redis-cli INCR "{queue_name}:id"'
result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

print(f"✓ Job {job_id} added to repo-clone queue")
print(f"Repository ID: {repo_id}")
