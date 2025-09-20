const GophishClient = require('./lib/gophishClient');

// Test configuration
const config = {
  baseURL: 'https://localhost:3333',
  apiKey: 'your-api-key-here', // Replace with your actual API key
  timeout: 10000
};

async function testGophishAPI() {
  console.log('🧪 Testing Gophish API Client...\n');
  
  // Create client instance
  const client = new GophishClient(config);
  
  try {
    // Test 1: Connection Test
    console.log('1️⃣ Testing Connection...');
    const connectionResult = await client.testConnection();
    console.log('Connection Result:', connectionResult);
    console.log('');
    
    if (!connectionResult.success) {
      console.log('❌ Connection failed. Please check your Gophish server and API key.');
      return;
    }
    
    // Test 2: Get Campaigns
    console.log('2️⃣ Testing Get Campaigns...');
    const campaignsResult = await client.getCampaigns();
    console.log('Campaigns Result:', {
      success: campaignsResult.success,
      status: campaignsResult.status,
      count: campaignsResult.success ? campaignsResult.data.length : 0
    });
    console.log('');
    
    // Test 3: Get Groups
    console.log('3️⃣ Testing Get Groups...');
    const groupsResult = await client.getGroups();
    console.log('Groups Result:', {
      success: groupsResult.success,
      status: groupsResult.status,
      count: groupsResult.success ? groupsResult.data.length : 0
    });
    console.log('');
    
    // Test 4: Get Templates
    console.log('4️⃣ Testing Get Templates...');
    const templatesResult = await client.getTemplates();
    console.log('Templates Result:', {
      success: templatesResult.success,
      status: templatesResult.status,
      count: templatesResult.success ? templatesResult.data.length : 0
    });
    console.log('');
    
    // Test 5: Get Landing Pages
    console.log('5️⃣ Testing Get Landing Pages...');
    const pagesResult = await client.getPages();
    console.log('Pages Result:', {
      success: pagesResult.success,
      status: pagesResult.status,
      count: pagesResult.success ? pagesResult.data.length : 0
    });
    console.log('');
    
    // Test 6: Get SMTP Profiles
    console.log('6️⃣ Testing Get SMTP Profiles...');
    const smtpResult = await client.getSmtpProfiles();
    console.log('SMTP Result:', {
      success: smtpResult.success,
      status: smtpResult.status,
      count: smtpResult.success ? smtpResult.data.length : 0
    });
    console.log('');
    
    // Test 7: Get Users
    console.log('7️⃣ Testing Get Users...');
    const usersResult = await client.getUsers();
    console.log('Users Result:', {
      success: usersResult.success,
      status: usersResult.status,
      count: usersResult.success ? usersResult.data.length : 0
    });
    console.log('');
    
    // Test 8: Get Configuration
    console.log('8️⃣ Testing Get Configuration...');
    const config = client.getConfig();
    console.log('Client Config:', config);
    console.log('');
    
    console.log('✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Example usage functions
async function createSampleCampaign() {
  console.log('📧 Creating Sample Campaign...\n');
  
  const client = new GophishClient(config);
  
  const campaignData = {
    name: "Test Phishing Campaign",
    template: {
      id: 1 // Replace with actual template ID
    },
    page: {
      id: 1 // Replace with actual landing page ID
    },
    smtp: {
      id: 1 // Replace with actual SMTP profile ID
    },
    groups: [
      {
        id: 1 // Replace with actual group ID
      }
    ],
    url: "https://example.com",
    launch_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Launch tomorrow
    send_by_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Send within a week
  };
  
  try {
    const result = await client.createCampaign(campaignData);
    console.log('Campaign Creation Result:', result);
  } catch (error) {
    console.error('Failed to create campaign:', error.message);
  }
}

async function createSampleGroup() {
  console.log('👥 Creating Sample Group...\n');
  
  const client = new GophishClient(config);
  
  const groupData = {
    name: "Test Group",
    targets: [
      {
        email: "test1@example.com",
        first_name: "John",
        last_name: "Doe",
        position: "Employee"
      },
      {
        email: "test2@example.com",
        first_name: "Jane",
        last_name: "Smith",
        position: "Manager"
      }
    ]
  };
  
  try {
    const result = await client.createGroup(groupData);
    console.log('Group Creation Result:', result);
  } catch (error) {
    console.error('Failed to create group:', error.message);
  }
}

// Run tests
if (require.main === module) {
  testGophishAPI();
  
  // Uncomment the following lines to test creation functions
  // setTimeout(() => createSampleGroup(), 2000);
  // setTimeout(() => createSampleCampaign(), 4000);
}

module.exports = {
  testGophishAPI,
  createSampleCampaign,
  createSampleGroup
}; 