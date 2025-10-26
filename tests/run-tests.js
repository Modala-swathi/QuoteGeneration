#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class TestRunner {
  constructor() {
    this.testSuites = [
      { name: 'Selenium UI Tests', path: 'tests/selenium/selenium-tests.js' },
      { name: 'API Tests', path: 'tests/api/api-tests.js' },
      { name: 'Integration Tests', path: 'tests/integration/integration-tests.js' }
    ];
    this.results = [];
  }

  async runTestSuite(suite) {
    console.log(`\n🚀 Running ${suite.name}...`);
    console.log('=' .repeat(50));
    
    return new Promise((resolve) => {
      const testProcess = spawn('node', [suite.path], {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      testProcess.on('close', (code) => {
        const success = code === 0;
        console.log(`\n${success ? '✅' : '❌'} ${suite.name}: ${success ? 'PASSED' : 'FAILED'}`);
        
        this.results.push({
          name: suite.name,
          success: success,
          exitCode: code
        });
        
        resolve(success);
      });
      
      testProcess.on('error', (error) => {
        console.error(`❌ Error running ${suite.name}:`, error.message);
        this.results.push({
          name: suite.name,
          success: false,
          error: error.message
        });
        resolve(false);
      });
    });
  }

  async runAllTests() {
    console.log('🧪 Daily Quotes Test Suite Runner');
    console.log('==================================');
    console.log('This will run all test suites for the Daily Quotes application.\n');
    
    const startTime = Date.now();
    
    for (const suite of this.testSuites) {
      await this.runTestSuite(suite);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    this.printSummary(totalTime);
    
    const allPassed = this.results.every(result => result.success);
    process.exit(allPassed ? 0 : 1);
  }

  printSummary(totalTime) {
    console.log('\n📊 Test Suite Summary');
    console.log('====================');
    
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    
    this.results.forEach(result => {
      const status = result.success ? '✅ PASSED' : '❌ FAILED';
      console.log(`${status} - ${result.name}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('\n📈 Overall Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`📊 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! Your Daily Quotes app is working perfectly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the output above for details.');
    }
  }
}

// Command line argument handling
const args = process.argv.slice(2);
const testRunner = new TestRunner();

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Daily Quotes Test Runner

Usage:
  node tests/run-tests.js [options]

Options:
  --help, -h     Show this help message
  --selenium     Run only Selenium UI tests
  --api          Run only API tests
  --integration  Run only integration tests
  --quick        Run quick tests (skip integration)

Examples:
  node tests/run-tests.js                    # Run all tests
  node tests/run-tests.js --selenium         # Run only UI tests
  node tests/run-tests.js --api --quick      # Run API tests only
`);
  process.exit(0);
}

// Filter test suites based on arguments
if (args.includes('--selenium')) {
  testRunner.testSuites = testRunner.testSuites.filter(s => s.name.includes('Selenium'));
}
if (args.includes('--api')) {
  testRunner.testSuites = testRunner.testSuites.filter(s => s.name.includes('API'));
}
if (args.includes('--integration')) {
  testRunner.testSuites = testRunner.testSuites.filter(s => s.name.includes('Integration'));
}
if (args.includes('--quick')) {
  testRunner.testSuites = testRunner.testSuites.filter(s => !s.name.includes('Integration'));
}

// Run the tests
testRunner.runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error.message);
  process.exit(1);
});
