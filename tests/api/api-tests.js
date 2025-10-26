import request from 'supertest';
import express from 'express';
import fetch from 'node-fetch';

// Mock the external API for testing
const mockQuoteResponse = [
  {
    q: "The only way to do great work is to love what you do.",
    a: "Steve Jobs",
    h: "<blockquote>&ldquo;The only way to do great work is to love what you do.&rdquo; &mdash; <footer>Steve Jobs</footer></blockquote>"
  }
];

// Create a test server
const createTestServer = () => {
  const app = express();
  
  app.get('/quote', async (req, res) => {
    try {
      // In real tests, you might want to mock the external API
      const response = await fetch("https://zenquotes.io/api/random");
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching quote:", error.message);
      res.status(500).json({ error: "Failed to fetch quote" });
    }
  });
  
  return app;
};

class APITestSuite {
  constructor() {
    this.app = createTestServer();
    this.baseUrl = 'http://localhost:3000';
  }

  async testQuoteEndpoint() {
    console.log('Testing /quote endpoint...');
    
    try {
      const response = await request(this.app)
        .get('/quote')
        .expect(200);
      
      const data = response.body;
      
      // Verify response structure
      const isValidStructure = Array.isArray(data) && 
                              data.length > 0 && 
                              data[0].hasOwnProperty('q') && 
                              data[0].hasOwnProperty('a');
      
      console.log(`✓ Quote endpoint response structure valid: ${isValidStructure}`);
      
      if (isValidStructure) {
        console.log(`✓ Quote: "${data[0].q}"`);
        console.log(`✓ Author: ${data[0].a}`);
      }
      
      return isValidStructure;
    } catch (error) {
      console.log(`❌ Quote endpoint test failed: ${error.message}`);
      return false;
    }
  }

  async testQuoteEndpointErrorHandling() {
    console.log('Testing /quote endpoint error handling...');
    
    try {
      // Test with invalid endpoint
      const response = await request(this.app)
        .get('/invalid-endpoint')
        .expect(404);
      
      console.log('✓ Invalid endpoint returns 404');
      return true;
    } catch (error) {
      console.log(`❌ Error handling test failed: ${error.message}`);
      return false;
    }
  }

  async testExternalAPI() {
    console.log('Testing external API connectivity...');
    
    try {
      const response = await fetch("https://zenquotes.io/api/random");
      
      if (!response.ok) {
        console.log(`❌ External API returned status: ${response.status}`);
        return false;
      }
      
      const data = await response.json();
      const isValidData = Array.isArray(data) && 
                         data.length > 0 && 
                         data[0].hasOwnProperty('q') && 
                         data[0].hasOwnProperty('a');
      
      console.log(`✓ External API connectivity: ${isValidData}`);
      
      if (isValidData) {
        console.log(`✓ Sample quote: "${data[0].q}"`);
        console.log(`✓ Sample author: ${data[0].a}`);
      }
      
      return isValidData;
    } catch (error) {
      console.log(`❌ External API test failed: ${error.message}`);
      return false;
    }
  }

  async testResponseTime() {
    console.log('Testing API response time...');
    
    const startTime = Date.now();
    
    try {
      const response = await request(this.app)
        .get('/quote')
        .expect(200);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`✓ API response time: ${responseTime}ms`);
      
      // Consider response time acceptable if under 5 seconds
      const isAcceptable = responseTime < 5000;
      console.log(`✓ Response time acceptable: ${isAcceptable}`);
      
      return isAcceptable;
    } catch (error) {
      console.log(`❌ Response time test failed: ${error.message}`);
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting API Tests for Daily Quotes App\n');
    
    const tests = [
      { name: 'Quote Endpoint', fn: () => this.testQuoteEndpoint() },
      { name: 'Error Handling', fn: () => this.testQuoteEndpointErrorHandling() },
      { name: 'External API', fn: () => this.testExternalAPI() },
      { name: 'Response Time', fn: () => this.testResponseTime() }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
      try {
        console.log(`\n📋 Running: ${test.name}`);
        const result = await test.fn();
        if (result) {
          console.log(`✅ ${test.name}: PASSED`);
          passed++;
        } else {
          console.log(`❌ ${test.name}: FAILED`);
          failed++;
        }
      } catch (error) {
        console.log(`❌ ${test.name}: ERROR - ${error.message}`);
        failed++;
      }
    }
    
    console.log(`\n📊 Test Results:`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    return failed === 0;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testSuite = new APITestSuite();
  testSuite.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export default APITestSuite;
