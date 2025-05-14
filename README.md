# Sentrifense - Phishing Control Center

Sentrifense is a comprehensive phishing control center that provides a modern UI for managing Gophish phishing campaigns. It's built with React, TypeScript, and Express, offering a more powerful and user-friendly interface for security teams.

## Features

- **Campaign Management**: Create, monitor, and analyze phishing campaigns
- **SMTP Profile Management**: Configure and test email sending settings
- **Email Templates**: Create and edit phishing email templates
- **Landing Pages**: Design convincing landing pages for credential harvesting
- **User Groups**: Manage and organize target recipients
- **Real-time Monitoring**: Track campaign progress with WebSocket updates
- **Comprehensive Analytics**: View detailed metrics and reports
- **Role-based Access Control**: Manage user permissions

## User Management

The platform now includes comprehensive user management features, allowing administrators to:

- View all users in a table with filtering and search capabilities
- Create new users with appropriate roles and permissions
- Edit user profiles and update account information
- Activate or deactivate user accounts 
- Delete users when necessary
- Bulk import users from CSV files
- View detailed user information including tenant access

User roles include:
- Super Admin: Full system access
- Admin: Administrative access to assigned tenants
- User: Regular user access to assigned tenants

This user management system integrates with the tenant management system, allowing users to be assigned to specific tenants with appropriate roles.

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express, MongoDB, Socket.io
- **Integration**: Gophish API

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Gophish instance running

### Installation

```sh
# Clone the repository
git clone https://github.com/yourusername/sentrifense.git
cd sentrifense

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Configuration

Create a `.env` file in the root directory:

```
VITE_API_URL=http://localhost:5000/api
MONGODB_URI=mongodb://localhost:27017/sentrifense
GOPHISH_API_KEY=your_gophish_api_key
GOPHISH_API_URL=https://your-gophish-instance:3333
JWT_SECRET=your_jwt_secret
```

## Project Status

### Completed

- Project structure and base components
- Basic campaign management
- Webhook integration and event handling
- SMTP profile management
- TypeScript interfaces for API entities

### In Progress

- Email template editor
- Landing page management
- User group management
- Authentication and authorization
- Data export features

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## CI/CD Pipeline

Sentrifense uses a robust CI/CD pipeline for automated testing and deployment:

- **Continuous Integration**: Automated linting and testing on all pull requests
- **Continuous Deployment**: Automated deployment to production when changes are merged to main
- **Docker Support**: Containerized deployment for consistent environments
- **Rollback Capability**: Easy rollback to previous versions if needed

For detailed information about the CI/CD pipeline, see [CI/CD Pipeline Documentation](docs/CI_CD_PIPELINE.md).

## License

This project is licensed under the MIT License - see the LICENSE file for details.
