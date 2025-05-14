# Sentrifense CI/CD Pipeline Documentation

This document provides information about the CI/CD (Continuous Integration/Continuous Deployment) pipeline for the Sentrifense application.

## Overview

The Sentrifense CI/CD pipeline automates the process of testing, building, and deploying the application, ensuring consistent and reliable releases. The pipeline is implemented using GitHub Actions and includes several stages:

1. **Lint and Test**: Validates code quality and runs tests
2. **Build**: Compiles the application and prepares artifacts
3. **Docker Build**: Creates Docker images for containerized deployment
4. **Deploy**: Deploys the application to the production environment

## Pipeline Workflow

### Triggering the Pipeline

The CI/CD pipeline is automatically triggered on:
- **Push** to the `main` branch
- **Pull Requests** targeting the `main` branch

### Pipeline Stages

#### 1. Lint and Test

This stage ensures code quality and correctness:
- Sets up the necessary environment (Node.js, MongoDB)
- Installs dependencies for frontend and backend
- Runs ESLint to check code quality
- Sets up test environment
- Runs automated tests (when implemented)

#### 2. Build

This stage compiles the application code:
- Builds the frontend React application
- Prepares the backend for deployment
- Uploads build artifacts for use in subsequent stages

#### 3. Docker Build

This stage builds Docker images (only on `main` branch):
- Logs in to Docker Hub registry
- Builds and tags Docker images for frontend and middleware
- Pushes images to Docker Hub

#### 4. Deploy

This stage deploys to production (only on `main` branch):
- Establishes SSH connection to the production server
- Pulls the latest code
- Updates Docker containers
- Performs cleanup

## Repository Secrets

The pipeline requires several secrets to be configured in the GitHub repository:

| Secret Name | Description |
|-------------|-------------|
| `DOCKERHUB_USERNAME` | Docker Hub username for image publishing |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `SSH_PRIVATE_KEY` | SSH private key for connecting to the deployment server |
| `SSH_KNOWN_HOSTS` | SSH known hosts data for the deployment server |
| `SSH_HOST` | Hostname or IP address of the deployment server |
| `SSH_USER` | SSH username for the deployment server |

## Local Development Workflow

For local development, you don't need to interact with the CI/CD pipeline directly. Follow these best practices:

1. Create feature branches from `main`
2. Make changes and test locally
3. Submit a pull request to the `main` branch
4. The CI/CD pipeline will automatically test your changes
5. After approval and merge, the pipeline will deploy to production

## Deployment Scripts

The following scripts help with deployment tasks:

### Environment Setup

The `scripts/setup-environment.sh` script prepares a new environment for deployment:
- Creates necessary directories
- Sets up configuration files
- Creates backup and monitoring scripts
- Configures automated database backups

Usage:
```bash
bash scripts/setup-environment.sh
```

### Deployment

The `scripts/deploy.sh` script handles deployment tasks:
- Creates backups before deployment
- Updates code from the repository
- Rebuilds and restarts Docker containers
- Verifies successful deployment
- Provides rollback capability

Usage:
```bash
# Normal deployment
bash scripts/deploy.sh

# Skip backup creation
bash scripts/deploy.sh --no-backup

# Rollback to previous deployment
bash scripts/deploy.sh --rollback
```

## Monitoring and Maintenance

### Database Backups

MongoDB data is automatically backed up daily at 2 AM using a cron job. Backups are stored in `~/sentrifense/backups` and retained for 7 days.

Manual backup:
```bash
~/sentrifense/backup-mongodb.sh
```

### Service Monitoring

Basic service monitoring:
```bash
~/sentrifense/monitor.sh
```

## Troubleshooting

### Failed Pipeline

If the pipeline fails:

1. Check the GitHub Actions logs for error details
2. Fix the issues in your development environment
3. Commit the fixes and push again

### Failed Deployment

If deployment fails:

1. Check logs: `docker-compose logs`
2. Use the rollback option if needed: `~/sentrifense/deploy.sh --rollback`
3. Check service status: `docker-compose ps`

## Pipeline Customization

To modify the CI/CD pipeline:

1. Edit the `.github/workflows/ci-cd.yml` file
2. Follow GitHub Actions documentation for syntax and available actions
3. Test changes by creating a pull request

## Best Practices

- Always write and run tests locally before pushing changes
- Keep the `main` branch stable and deployable at all times
- Use feature branches for development
- Review the pipeline logs after each deployment
- Periodically verify backups by test-restoring them 

## 1. Schedule regular backups using cron jobs

Add to your crontab:
```
0 2 * * * /path/to/scripts/db-backup.sh >> /var/log/mongodb-backup.log 2>&1

# Daily backup monitoring at 6 AM
0 6 * * * /path/to/scripts/monitor-backups.sh >> /var/log/backup-monitoring.log 2>&1
```

## 2. Set up automated notifications

Add to your monitor-backups.sh to send email alerts:
```bash
# Send email notification if backup fails
if [ $backup_status -ne 0 ]; then
    echo "Backup failed on $(hostname) at $(date)" | mail -s "ALERT: MongoDB Backup Failed" your-email@example.com
fi
```

## 3. Test restoration procedures

Create a test script:
```bash
#!/bin/bash
# Test restoration in development environment
set -e

echo "Creating test database..."
TEST_DB="sentrifense_test_$(date +%s)"
export MONGODB_DATABASE=$TEST_DB

echo "Restoring from latest backup..."
./scripts/db-restore.sh --latest

echo "Verifying restoration..."
# Add verification queries here

echo "Cleanup test database..."
mongo --eval "db.dropDatabase()" $TEST_DB
```

## 4. Integration with deployment pipeline

Add to your CI/CD configuration:
```yaml
backup-before-deployment:
  stage: pre-deployment
  script:
    - ./scripts/db-backup.sh --pre-deployment
  artifacts:
    paths:
      - backups/pre-deployment/
```

## 5. Documentation for the team

Create docs/database-backup.md with:
- Overview of backup strategy
- Schedule and retention policies
- Manual backup/restore procedures
- Troubleshooting steps

## 6. Disaster recovery plan

Create a disaster recovery document outlining:
- Recovery time objectives (RTO)
- Recovery point objectives (RPO)
- Step-by-step recovery procedures
- Contact information for responsible team members
- Testing schedule for disaster recovery procedures 