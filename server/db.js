// Local storage implementation to replace MongoDB
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TENANTS_FILE = path.join(DATA_DIR, 'tenants.json');
const CAMPAIGNS_FILE = path.join(DATA_DIR, 'campaigns.json');
const WEBHOOKS_FILE = path.join(DATA_DIR, 'webhooks.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize empty files if they don't exist
const initializeFile = (filePath, defaultData = []) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
};

// Initialize all data files
initializeFile(USERS_FILE);
initializeFile(TENANTS_FILE);
initializeFile(CAMPAIGNS_FILE);
initializeFile(WEBHOOKS_FILE);

// Local storage functions
const localDB = {
  // Users
  getUsers: () => {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  },
  
  saveUsers: (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  },
  
  addUser: (user) => {
    const users = localDB.getUsers();
    user.id = Date.now().toString(); // Simple ID generation
    user.createdAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();
    users.push(user);
    localDB.saveUsers(users);
    return user;
  },
  
  updateUser: (id, updates) => {
    const users = localDB.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates, updatedAt: new Date().toISOString() };
      localDB.saveUsers(users);
      return users[index];
    }
    return null;
  },
  
  findUserByEmail: (email) => {
    const users = localDB.getUsers();
    return users.find(u => u.email === email);
  },
  
  findUserById: (id) => {
    const users = localDB.getUsers();
    return users.find(u => u.id === id);
  },
  
  // Tenants
  getTenants: () => {
    const data = fs.readFileSync(TENANTS_FILE, 'utf8');
    return JSON.parse(data);
  },
  
  saveTenants: (tenants) => {
    fs.writeFileSync(TENANTS_FILE, JSON.stringify(tenants, null, 2));
  },
  
  addTenant: (tenant) => {
    const tenants = localDB.getTenants();
    tenant.id = Date.now().toString();
    tenant.createdAt = new Date().toISOString();
    tenant.updatedAt = new Date().toISOString();
    tenants.push(tenant);
    localDB.saveTenants(tenants);
    return tenant;
  },
  
  findTenantById: (id) => {
    const tenants = localDB.getTenants();
    return tenants.find(t => t.id === id);
  },
  
  // Campaigns
  getCampaigns: () => {
    const data = fs.readFileSync(CAMPAIGNS_FILE, 'utf8');
    return JSON.parse(data);
  },
  
  saveCampaigns: (campaigns) => {
    fs.writeFileSync(CAMPAIGNS_FILE, JSON.stringify(campaigns, null, 2));
  },
  
  addCampaign: (campaign) => {
    const campaigns = localDB.getCampaigns();
    campaign.id = Date.now().toString();
    campaign.createdAt = new Date().toISOString();
    campaign.updatedAt = new Date().toISOString();
    campaigns.push(campaign);
    localDB.saveCampaigns(campaigns);
    return campaign;
  },
  
  // Webhooks
  getWebhooks: () => {
    const data = fs.readFileSync(WEBHOOKS_FILE, 'utf8');
    return JSON.parse(data);
  },
  
  saveWebhooks: (webhooks) => {
    fs.writeFileSync(WEBHOOKS_FILE, JSON.stringify(webhooks, null, 2));
  },
  
  addWebhook: (webhook) => {
    const webhooks = localDB.getWebhooks();
    webhook.id = Date.now().toString();
    webhook.timestamp = new Date().toISOString();
    webhooks.push(webhook);
    localDB.saveWebhooks(webhooks);
    return webhook;
  }
};

// Mock MongoDB connection function
const connectDB = () => {
  console.log('Local storage initialized');
  return Promise.resolve();
};

module.exports = { connectDB, localDB }; 