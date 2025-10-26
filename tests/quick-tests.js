import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple test runner for quick testing
class QuickTestRunner {
  constructor() {
    this.serverProcess = null;
  }

  async startServer() {
    console.log('🚀 Starting server for testing...');
    
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('node', ['server.js'], {
        stdio: 'pipe',
        cwd: process.cwd()
      });
      
      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Server running at')) {
          console.log('✅ Server started successfully');
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
      
      setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 10000);
    });
  }

  async stopServer() {
    if (this.serverProcess) {
      console.log('🛑 Stopping server...');
      this.serverProcess.kill();
      this.serverProcess = null;
    }
  }

  async runQuickTests() {
    console.log('🧪 Running Quick Tests for Daily Quotes App\n');
    
    try {
      await this.startServer();
      
      // Import and run test suites
      const SeleniumTests = await import('./selenium/selenium-tests.js');
      const APITests = await import('./api/api-tests.js');
      
      console.log('📋 Running Selenium UI Tests...');
      const seleniumSuite = new SeleniumTests.default();
      const seleniumResult = await seleniumSuite.runAllTests();
      
      console.log('\n📋 Running API Tests...');
      const apiSuite = new APITests.default();
      const apiResult = await apiSuite.runAllTests();
      
      console.log('\n📊 Quick Test Results:');
      console.log(`✅ Selenium Tests: ${seleniumResult ? 'PASSED' : 'FAILED'}`);
      console.log(`✅ API Tests: ${apiResult ? 'PASSED' : 'FAILED'}`);
      
      const allPassed = seleniumResult && apiResult;
      console.log(`\n🎯 Overall Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
      
      return allPassed;
      
    } catch (error) {
      console.error('❌ Quick tests failed:', error.message);
      return false;
    } finally {
      await this.stopServer();
    }
  }
}

// Run quick tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new QuickTestRunner();
  runner.runQuickTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export default QuickTestRunner;
