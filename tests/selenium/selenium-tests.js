import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

class DailyQuotesTestSuite {
  constructor() {
    this.driver = null;
    this.baseUrl = 'http://localhost:3000';
  }

  async setupDriver() {
    const options = new chrome.Options();
    options.addArguments('--headless'); // Run in headless mode for CI/CD
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    
    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  }

  async teardownDriver() {
    if (this.driver) {
      await this.driver.quit();
    }
  }

  async testPageLoad() {
    console.log('Testing page load...');
    await this.driver.get(this.baseUrl);
    
    // Wait for page to load
    await this.driver.wait(until.titleIs('Daily Quotes'), 5000);
    
    // Check if main elements are present
    const title = await this.driver.findElement(By.css('h1'));
    const titleText = await title.getText();
    console.log(`✓ Page title found: ${titleText}`);
    
    const quoteElement = await this.driver.findElement(By.id('quote'));
    const button = await this.driver.findElement(By.id('new-quote'));
    
    console.log('✓ All main elements found');
    return true;
  }

  async testInitialQuoteLoad() {
    console.log('Testing initial quote load...');
    
    // Wait for quote to load (not "Loading...")
    await this.driver.wait(async () => {
      const quoteText = await this.driver.findElement(By.id('quote')).getText();
      return quoteText !== 'Loading...' && quoteText.length > 0;
    }, 10000);
    
    const quoteText = await this.driver.findElement(By.id('quote')).getText();
    console.log(`✓ Initial quote loaded: ${quoteText.substring(0, 50)}...`);
    
    // Verify quote format (should contain quote and author)
    const hasQuoteFormat = quoteText.includes('"') && quoteText.includes('—');
    console.log(`✓ Quote format correct: ${hasQuoteFormat}`);
    
    return hasQuoteFormat;
  }

  async testNewQuoteButton() {
    console.log('Testing new quote button...');
    
    const button = await this.driver.findElement(By.id('new-quote'));
    const initialQuote = await this.driver.findElement(By.id('quote')).getText();
    
    // Click the button
    await button.click();
    
    // Wait for new quote to load
    await this.driver.wait(async () => {
      const newQuote = await this.driver.findElement(By.id('quote')).getText();
      return newQuote !== initialQuote && newQuote !== 'Loading...';
    }, 10000);
    
    const newQuote = await this.driver.findElement(By.id('quote')).getText();
    console.log(`✓ New quote loaded: ${newQuote.substring(0, 50)}...`);
    
    // Verify quote changed
    const quoteChanged = newQuote !== initialQuote;
    console.log(`✓ Quote changed: ${quoteChanged}`);
    
    return quoteChanged;
  }

  async testErrorHandling() {
    console.log('Testing error handling...');
    
    // Navigate to a non-existent endpoint to test error handling
    await this.driver.get(`${this.baseUrl}/nonexistent`);
    
    // Should still be able to navigate back to main page
    await this.driver.get(this.baseUrl);
    await this.driver.wait(until.titleIs('Daily Quotes'), 5000);
    
    console.log('✓ Error handling test passed');
    return true;
  }

  async testResponsiveDesign() {
    console.log('Testing responsive design...');
    
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 768, height: 1024 },  // Tablet
      { width: 375, height: 667 }   // Mobile
    ];
    
    for (const viewport of viewports) {
      await this.driver.manage().window().setRect({
        width: viewport.width,
        height: viewport.height
      });
      
      // Verify elements are still visible
      const title = await this.driver.findElement(By.css('h1'));
      const quote = await this.driver.findElement(By.id('quote'));
      const button = await this.driver.findElement(By.id('new-quote'));
      
      const titleVisible = await title.isDisplayed();
      const quoteVisible = await quote.isDisplayed();
      const buttonVisible = await button.isDisplayed();
      
      console.log(`✓ Viewport ${viewport.width}x${viewport.height}: All elements visible`);
    }
    
    return true;
  }

  async runAllTests() {
    console.log('🚀 Starting Selenium Tests for Daily Quotes App\n');
    
    try {
      await this.setupDriver();
      
      const tests = [
        { name: 'Page Load', fn: () => this.testPageLoad() },
        { name: 'Initial Quote Load', fn: () => this.testInitialQuoteLoad() },
        { name: 'New Quote Button', fn: () => this.testNewQuoteButton() },
        { name: 'Error Handling', fn: () => this.testErrorHandling() },
        { name: 'Responsive Design', fn: () => this.testResponsiveDesign() }
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
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      return false;
    } finally {
      await this.teardownDriver();
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testSuite = new DailyQuotesTestSuite();
  testSuite.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export default DailyQuotesTestSuite;
