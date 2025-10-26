import { spawn } from 'child_process';
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import request from 'supertest';
import express from 'express';
import fetch from 'node-fetch';

class IntegrationTestSuite {
  constructor() {
    this.serverProcess = null;
    this.driver = null;
    this.baseUrl = 'http://localhost:3000';
  }

  async startServer() {
    console.log('🚀 Starting test server...');
    
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('node', ['server.js'], {
        stdio: 'pipe',
        cwd: process.cwd()
      });
      
      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`Server: ${output.trim()}`);
        if (output.includes('Server running at')) {
          resolve();
        }
      });
      
      this.serverProcess.stderr.on('data', (data) => {
        console.error(`Server Error: ${data}`);
      });
      
      this.serverProcess.on('error', (error) => {
        console.error('Failed to start server:', error);
        reject(error);
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 10000);
    });
  }

  async stopServer() {
    if (this.serverProcess) {
      console.log('🛑 Stopping test server...');
      this.serverProcess.kill();
      this.serverProcess = null;
    }
  }

  async setupDriver() {
    console.log('🔧 Setting up Selenium driver...');
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    
    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  }

  async teardownDriver() {
    if (this.driver) {
      console.log('🔧 Tearing down Selenium driver...');
      await this.driver.quit();
      this.driver = null;
    }
  }

  async testFullUserWorkflow() {
    console.log('Testing full user workflow...');
    
    try {
      // Navigate to the app
      await this.driver.get(this.baseUrl);
      await this.driver.wait(until.titleIs('Daily Quotes'), 5000);
      
      // Wait for initial quote to load
      await this.driver.wait(async () => {
        const quoteText = await this.driver.findElement(By.id('quote')).getText();
        return quoteText !== 'Loading...' && quoteText.length > 0;
      }, 10000);
      
      const initialQuote = await this.driver.findElement(By.id('quote')).getText();
      console.log(`✓ Initial quote loaded: ${initialQuote.substring(0, 50)}...`);
      
      // Click new quote button multiple times
      const button = await this.driver.findElement(By.id('new-quote'));
      
      for (let i = 0; i < 3; i++) {
        await button.click();
        
        // Wait for new quote
        await this.driver.wait(async () => {
          const newQuote = await this.driver.findElement(By.id('quote')).getText();
          return newQuote !== 'Loading...';
        }, 5000);
        
        const newQuote = await this.driver.findElement(By.id('quote')).getText();
        console.log(`✓ Quote ${i + 1} loaded: ${newQuote.substring(0, 50)}...`);
      }
      
      console.log('✓ Full user workflow completed successfully');
      return true;
      
    } catch (error) {
      console.log(`❌ Full user workflow test failed: ${error.message}`);
      return false;
    }
  }

  async testAPIIntegration() {
    console.log('Testing API integration...');
    
    try {
      // Test the API endpoint directly
      const response = await request(express().use(express.static('public')))
        .get('/quote')
        .expect(200);
      
      const data = response.body;
      const isValidData = Array.isArray(data) && 
                         data.length > 0 && 
                         data[0].hasOwnProperty('q') && 
                         data[0].hasOwnProperty('a');
      
      console.log(`✓ API integration test: ${isValidData}`);
      
      if (isValidData) {
        console.log(`✓ API returned: "${data[0].q}" — ${data[0].a}`);
      }
      
      return isValidData;
      
    } catch (error) {
      console.log(`❌ API integration test failed: ${error.message}`);
      return false;
    }
  }

  async testErrorRecovery() {
    console.log('Testing error recovery...');
    
    try {
      // Navigate to the app
      await this.driver.get(this.baseUrl);
      
      // Simulate network issues by navigating to invalid page and back
      await this.driver.get(`${this.baseUrl}/nonexistent`);
      await this.driver.get(this.baseUrl);
      
      // Verify app still works
      await this.driver.wait(until.titleIs('Daily Quotes'), 5000);
      
      const button = await this.driver.findElement(By.id('new-quote'));
      await button.click();
      
      // Wait for quote to load
      await this.driver.wait(async () => {
        const quoteText = await this.driver.findElement(By.id('quote')).getText();
        return quoteText !== 'Loading...';
      }, 10000);
      
      console.log('✓ Error recovery test passed');
      return true;
      
    } catch (error) {
      console.log(`❌ Error recovery test failed: ${error.message}`);
      return false;
    }
  }

  async testPerformance() {
    console.log('Testing performance...');
    
    try {
      const startTime = Date.now();
      
      // Navigate and load initial quote
      await this.driver.get(this.baseUrl);
      await this.driver.wait(async () => {
        const quoteText = await this.driver.findElement(By.id('quote')).getText();
        return quoteText !== 'Loading...';
      }, 10000);
      
      const loadTime = Date.now() - startTime;
      console.log(`✓ Initial page load time: ${loadTime}ms`);
      
      // Test quote refresh performance
      const refreshStartTime = Date.now();
      const button = await this.driver.findElement(By.id('new-quote'));
      await button.click();
      
      await this.driver.wait(async () => {
        const quoteText = await this.driver.findElement(By.id('quote')).getText();
        return quoteText !== 'Loading...';
      }, 10000);
      
      const refreshTime = Date.now() - refreshStartTime;
      console.log(`✓ Quote refresh time: ${refreshTime}ms`);
      
      const isPerformant = loadTime < 10000 && refreshTime < 10000;
      console.log(`✓ Performance acceptable: ${isPerformant}`);
      
      return isPerformant;
      
    } catch (error) {
      console.log(`❌ Performance test failed: ${error.message}`);
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Integration Tests for Daily Quotes App\n');
    
    try {
      // Start server
      await this.startServer();
      
      // Setup driver
      await this.setupDriver();
      
      const tests = [
        { name: 'Full User Workflow', fn: () => this.testFullUserWorkflow() },
        { name: 'API Integration', fn: () => this.testAPIIntegration() },
        { name: 'Error Recovery', fn: () => this.testErrorRecovery() },
        { name: 'Performance', fn: () => this.testPerformance() }
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
      
      console.log(`\n📊 Integration Test Results:`);
      console.log(`✅ Passed: ${passed}`);
      console.log(`❌ Failed: ${failed}`);
      console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
      
      return failed === 0;
      
    } catch (error) {
      console.error('❌ Integration test suite failed:', error.message);
      return false;
    } finally {
      await this.teardownDriver();
      await this.stopServer();
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testSuite = new IntegrationTestSuite();
  testSuite.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export default IntegrationTestSuite;
