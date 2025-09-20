# Gophish API Integration

This document describes the comprehensive Gophish API integration for the Sentrifense phishing simulation SaaS platform.

## 🔐 Authentication

All API requests include the API key in the Authorization header:
```
Authorization: Bearer <API_KEY>
```

## 🏗️ Architecture

### GophishClient Class

The main API client is located at `server/lib/gophishClient.js` and provides:

- **Configurable base URL** and API key
- **Automatic SSL certificate handling** for self-signed certificates
- **Comprehensive error handling** with detailed error messages
- **Request/response interceptors** for logging and debugging
- **Consistent response format** across all endpoints

### Response Format

All API methods return a consistent response format:

```javascript
{
  success: boolean,      // true for 2xx responses, false otherwise
  data: any,            // Response data for successful requests
  error: string,        // Error message for failed requests
  status: number        // HTTP status code
}
```

## 📋 Available Endpoints

### 🎯 Campaigns

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/campaigns/` | List all campaigns |
| `GET` | `/api/campaigns/:id` | Get specific campaign |
| `POST` | `/api/campaigns/` | Create new campaign |
| `PUT` | `/api/campaigns/:id` | Update campaign |
| `DELETE` | `/api/campaigns/:id` | Delete campaign |
| `GET` | `/api/campaigns/:id/summary` | Get campaign stats |
| `POST` | `/api/campaigns/:id/complete` | Mark campaign as complete |
| `GET` | `/api/campaigns/:id/results` | Get campaign results |

### 👥 Groups

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/groups/` | List all groups |
| `GET` | `/api/groups/:id` | Get specific group |
| `POST` | `/api/groups/` | Create new group |
| `PUT` | `/api/groups/:id` | Update group |
| `DELETE` | `/api/groups/:id` | Delete group |

### 📧 Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/templates/` | List all templates |
| `GET` | `/api/templates/:id` | Get specific template |
| `POST` | `/api/templates/` | Create new template |
| `PUT` | `/api/templates/:id` | Update template |
| `DELETE` | `/api/templates/:id` | Delete template |

### 🌐 Landing Pages

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/pages/` | List all landing pages |
| `GET` | `/api/pages/:id` | Get specific landing page |
| `POST` | `/api/pages/` | Create new landing page |
| `PUT` | `/api/pages/:id` | Update landing page |
| `DELETE` | `/api/pages/:id` | Delete landing page |

### 📮 SMTP Profiles

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/smtp/` | List all SMTP profiles |
| `GET` | `/api/smtp/:id` | Get specific SMTP profile |
| `POST` | `/api/smtp/` | Create new SMTP profile |
| `PUT` | `/api/smtp/:id` | Update SMTP profile |
| `DELETE` | `/api/smtp/:id` | Delete SMTP profile |

### 👤 Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users/` | List all users |
| `GET` | `/api/users/:id` | Get specific user |
| `POST` | `/api/users/` | Create new user |
| `PUT` | `/api/users/:id` | Update user |
| `DELETE` | `/api/users/:id` | Delete user |

## 🚀 Usage Examples

### Basic Setup

```javascript
const GophishClient = require('./lib/gophishClient');

const client = new GophishClient({
  baseURL: 'https://your-gophish-server:3333',
  apiKey: 'your-api-key-here',
  timeout: 10000
});
```

### Test Connection

```javascript
const result = await client.testConnection();
if (result.success) {
  console.log('Connected to Gophish API');
} else {
  console.error('Connection failed:', result.error);
}
```

### Get All Campaigns

```javascript
const result = await client.getCampaigns();
if (result.success) {
  console.log('Campaigns:', result.data);
} else {
  console.error('Failed to get campaigns:', result.error);
}
```

### Create a Campaign

```javascript
const campaignData = {
  name: "Phishing Awareness Campaign",
  template: { id: 1 },
  page: { id: 1 },
  smtp: { id: 1 },
  groups: [{ id: 1 }],
  url: "https://example.com",
  launch_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
};

const result = await client.createCampaign(campaignData);
if (result.success) {
  console.log('Campaign created:', result.data);
} else {
  console.error('Failed to create campaign:', result.error);
}
```

### Create a Group

```javascript
const groupData = {
  name: "Test Group",
  targets: [
    {
      email: "user@example.com",
      first_name: "John",
      last_name: "Doe",
      position: "Employee"
    }
  ]
};

const result = await client.createGroup(groupData);
if (result.success) {
  console.log('Group created:', result.data);
} else {
  console.error('Failed to create group:', result.error);
}
```

### Get Campaign Results

```javascript
const result = await client.getCampaignResults(campaignId);
if (result.success) {
  console.log('Campaign results:', result.data);
} else {
  console.error('Failed to get results:', result.error);
}
```

## 🔧 Configuration

### Environment Variables

Set these environment variables in your `.env` file:

```bash
GOPHISH_BASE_URL=https://your-gophish-server:3333
GOPHISH_API_KEY=your-api-key-here
```

### Dynamic Configuration

You can update the client configuration at runtime:

```javascript
// Update API key
client.updateApiKey('new-api-key');

// Update base URL
client.updateBaseURL('https://new-server:3333');

// Get current configuration
const config = client.getConfig();
console.log(config);
```

## 🧪 Testing

Run the test script to verify your Gophish API integration:

```bash
cd server
node test-gophish-api.js
```

The test script will:
1. Test connection to Gophish API
2. Test all major endpoints
3. Display results and any errors
4. Provide example usage patterns

## 🛠️ Error Handling

The client provides comprehensive error handling:

### Network Errors
```javascript
{
  success: false,
  error: "Network error - no response received",
  status: 0
}
```

### API Errors
```javascript
{
  success: false,
  error: "API Error message from Gophish",
  status: 400
}
```

### SSL Certificate Errors
The client automatically handles self-signed certificates by disabling SSL verification.

## 📊 Local Storage Integration

The API client integrates with local storage for:

- **Caching**: Store campaign data locally for offline access
- **Backup**: Maintain data even if Gophish server is down
- **Performance**: Reduce API calls by using cached data
- **Resilience**: Continue operation during Gophish outages

## 🔒 Security Features

- **API Key Masking**: Sensitive data is masked in logs and responses
- **SSL Support**: Handles both valid and self-signed certificates
- **Request Logging**: Detailed logging for debugging and monitoring
- **Error Sanitization**: Prevents sensitive data leakage in error messages

## 📝 API Reference

For detailed API documentation, refer to:
- [Gophish API Documentation](https://docs.getgophish.com/api-documentation)
- [Gophish GitHub Repository](https://github.com/gophish/gophish)

## 🚨 Troubleshooting

### Common Issues

1. **SSL Certificate Errors**
   - The client automatically handles self-signed certificates
   - If issues persist, check your Gophish server configuration

2. **Authentication Errors**
   - Verify your API key is correct
   - Check that the API key has proper permissions

3. **Connection Timeouts**
   - Increase the timeout value in client configuration
   - Check network connectivity to Gophish server

4. **404 Errors**
   - Verify the Gophish server is running
   - Check that the base URL is correct

### Debug Mode

Enable detailed logging by setting the environment variable:
```bash
DEBUG=gophish:*
```

## 📈 Performance Considerations

- **Connection Pooling**: The client reuses HTTP connections
- **Request Batching**: Consider batching multiple requests
- **Caching**: Use local storage for frequently accessed data
- **Timeout Configuration**: Adjust timeouts based on your network

## 🔄 Migration from Old Client

If migrating from the old client:

1. Replace `createGophishClient()` calls with `new GophishClient()`
2. Update response handling to use the new format
3. Use the new error handling patterns
4. Test all endpoints with the new client

## 📞 Support

For issues with the Gophish API integration:

1. Check the troubleshooting section above
2. Review the Gophish API documentation
3. Test with the provided test script
4. Check server logs for detailed error information 