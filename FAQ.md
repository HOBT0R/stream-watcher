# Frequently Asked Questions (FAQ) for QA Testers

This document addresses common questions a Quality Assurance Tester (QAT) might have before starting to write and execute tests for the Stream Watcher application. It aims to provide practical guidance and complement the `TESTPLAN.md` and `TESTSCENARIOS.md` documents.

## 1. Application Setup & Execution

**Q: How do I get the application running locally on my machine?**
A: 

**Q: What are the minimum system requirements or recommended development environment settings?**
A: 

**Q: How do I access the application in a browser after starting it?**
A: 

## 2. Test Environment & Data Management

**Q: How do I set up my local environment to run the automated tests (Jest, Storybook)?**
A: 

**Q: Where can I find existing test data, or how do I create new test data for different scenarios (e.g., a large number of channels, specific online/offline statuses, diverse roles)?**
A: The primary default channel configuration is located at `src/config/defaults.json`. For various testing scenarios, you can use or modify this file, or create new JSON files with different channel configurations. Below are a few sample data sets for common testing needs:


### Sample Data Set: Role-Focused Mix (`src/config/defaults.role_focus.json`)
This dataset is smaller and designed to specifically test the role dropdown filtering, ensuring all role types are represented.


**Q: How can I easily switch between different sets of default channel configurations for testing the import/export functionality?**
A: There are several ways to test different channel configurations:

1. **Using the Import/Export UI**:
   - Use the "Import" button to load a different configuration file
   - This is the recommended way to test the actual user workflow

2. **For Automated Testing**:
   - Create a new JSON file in `src/config/` with your test data
   - Import it in your test file using:
     ```typescript
     import testConfig from '../config/your-test-config.json';
     ```
   - Use this configuration in your test cases

Remember to always keep a backup of your original `defaults.json` file before making changes.

**Q: For the manual verification steps (System Integration), how do I configure actual Twitch API credentials or backend endpoints to test against live services?**
A: 

## 3. Test Execution & Debugging

**Q: How do I run a specific unit, component, or integration test, or a subset of tests?**
A: 

**Q: How do I interpret the output of the test runs (Jest reports, Storybook console)?**
A: 

**Q: What are the best practices for debugging tests when they fail?**
A: 

**Q: How can I generate test coverage reports, and what's our target coverage?**
A: 

## 4. Storybook Usage

**Q: How do I navigate Storybook to find a specific component and its variations?**
A: 

**Q: Can I interact with the components in Storybook, and how do I save/share specific Storybook states for review?**
A: 

## 5. Accessibility Testing

**Q: Beyond the programmatic accessibility tests mentioned, are there any manual accessibility testing guidelines or tools we should use (e.g., screen readers, keyboard-only navigation for specific user flows)?**
A: 

## 6. Performance Testing

**Q: What tools or methodologies do we use for performance testing, since it's listed as a priority but no specific implementation details are provided?**
A: 

**Q: What are the performance benchmarks or acceptance criteria for the application?**
A: 

## 7. Collaboration & Workflow

**Q: What's the typical workflow for contributing new tests or updating existing ones (e.g., branching strategy, pull request process)?**
A: 
