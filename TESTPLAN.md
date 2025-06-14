# Stream Watcher Test Plan

This document outlines the testing strategy for the Stream Watcher application, including the tools we'll use, when to use them, and the overall approach to testing.

## Testing Tools

### Vitest + React Testing Library
Our primary testing framework for functional testing and behavior verification.

**Key Features:**
- Component behavior testing
- User interaction simulation
- State management verification
- API and data flow testing
- Error handling validation
- Programmatic accessibility testing

### Storybook
Our visual testing and documentation tool.

**Key Features:**
- Component visualization
- State variation documentation
- Design system verification
- Desktop layout adjustments testing
- Theme compatibility testing
- Visual accessibility testing

## Test File Organization

We follow a co-located test approach where test files are placed next to their corresponding source files. This approach offers several benefits:

- Clear relationship between tests and implementation
- Easier maintenance as related files are kept together
- Simplified navigation between test and source code
- Better visibility of test coverage at the component level

Example structure:
```
src/
  components/
    ChannelCard/
      ChannelCard.tsx
      ChannelCard.test.tsx
      ChannelCard.stories.tsx
    StreamKeyDialog/
      StreamKeyDialog.tsx
      StreamKeyDialog.test.tsx
      StreamKeyDialog.stories.tsx
  hooks/
    useChannelStatus.ts
    useChannelStatus.test.ts
  utils/
    channelConfig.ts
    channelConfig.test.ts
```

## Testing Tool Selection Guidelines

### When to Use Vitest + RTL
1.  **Component Behavior**
    - State management
    - Event handlers
    - Data transformations
    - Conditional rendering
    - Error handling
    - State transitions
    - State persistence

2.  **User Interactions**
    - Click events
    - Form submissions
    - Keyboard navigation
    - Keyboard shortcuts
    - Copy/paste operations
    - Dialog open/close
    - Drag and drop (if applicable)

3.  **Data Flow**
    - Props passing
    - Context usage
    - Redux/state management
    - API calls
    - LocalStorage operations
    - State persistence across reloads

4.  **Edge Cases**
    - Error states
    - Loading states
    - Empty states
    - Invalid inputs
    - Network failures
    - State recovery

5.  **Accessibility (Programmatic)**
    - Keyboard navigation
    - ARIA attributes
    - Focus management
    - Screen reader compatibility
    - Color contrast (programmatic)

### When to Use Storybook
1.  **Visual Testing**
    - Component variations
    - Theme changes
    - Desktop layout adjustments
    - Loading states
    - Error states
    - State transitions (visual)

2.  **Documentation**
    - Usage examples
    - Prop variations
    - State combinations
    - Best practices
    - Design guidelines
    - Component composition
    - Animation states
    - Theme variations

4.  **Accessibility (Visual)**
    - Visual color contrast
    - Screen reader testing
    - Keyboard navigation flow
    - ARIA implementation
    - Focus management visualization

### When to Use Both
- Testing complex components with multiple states
- Verifying both behavior and appearance
- Ensuring accessibility compliance
- Documenting component usage
- Testing theme variations
- Verifying desktop layout adjustments
- Testing state transitions
- Validating user interactions

## Test Implementation Strategy

### Test Types and Definitions

1.  **Unit Tests**
    - Tests individual functions, hooks, or utilities in isolation
    - Focuses on pure logic and data transformations
    - All external dependencies must be mocked:
      - API calls (Twitch API, BFF)
      - Browser APIs (localStorage, clipboard)
      - System APIs (prefers-color-scheme)
    - Examples in our codebase:
      - `highlightText` utility function
      - `getRoleChipColor` helper
      - `useLocalStorage` hook (with mocked localStorage)
      - State management reducers
      - API response transformers (with mocked responses)

2.  **Component Tests**
    - Tests React components in isolation
    - Verifies component behavior, rendering, and user interactions
    - Uses Vitest + RTL for functional testing
    - Uses Storybook for visual testing
    - External dependencies must be mocked:
      - API calls (using MSW or similar)
      - Browser APIs
      - System preferences
    - Examples in our codebase:
      - `ChannelCard` rendering and interactions
      - `StreamKeyDialog` open/close behavior (with mocked API)
      - `ChannelList` filtering and sorting
      - Form validation in `ChannelConfiguration`

3.  **Integration Tests**
    - Tests how components work together
    - Verifies data flow between components
    - Tests user flows that span multiple components
    - External dependencies must be mocked:
      - API calls (using MSW or similar)
      - Browser APIs
      - System preferences
    - Examples in our codebase:
      - Search functionality from `ChannelDashboard` to `ChannelCard`
      - Channel configuration updates propagating to the dashboard
      - Theme changes affecting all components
      - Import/Export functionality with the file system

### Testing Approach

1.  **Component Testing Order**
    - Start with leaf components (`ChannelCard`, `StreamKeyDialog`)
    - Move to container components (`ChannelList`, `ChannelGroup`)
    - End with page-level components (`ChannelDashboard`, `ChannelConfiguration`)

2.  **Test Coverage Priority**
    - Critical user flows first
    - Error handling and edge cases second
    - Visual and accessibility testing third
    - Performance testing last

3.  **Implementation Approach**
    - Write Vitest + RTL tests first
    - Create Storybook stories in parallel
    - Update documentation as tests are written
    - Review and refactor based on test coverage

### Test Implementation Guidelines

1.  **Unit Tests**
    - Write tests for all utility functions and hooks
    - Mock all external dependencies:
      - Use `vi.mock()` for module dependencies
      - Use `vi.spyOn()` for browser APIs
      - Use MSW for API mocking
    - Test edge cases and error conditions
    - Focus on pure logic and data transformations
    - Never make real API calls or access real external services

2.  **Component Tests**
    - Test component rendering with different props
    - Verify user interactions
    - Test error states and loading states
    - Ensure accessibility compliance
    - Create Storybook stories for visual verification
    - Mock all external dependencies:
      - Use MSW for API mocking
      - Mock browser APIs
      - Mock system preferences
    - Never make real API calls

3.  **Integration Tests**
    - Test complete user flows
    - Verify data propagation between components
    - Test state management across components
    - Ensure consistent behavior across the application
    - Mock all external dependencies:
      - Use MSW for API mocking
      - Mock browser APIs
      - Mock system preferences
    - Never make real API calls

### Mocking Strategy

1.  **API Mocking**
    - Use MSW (Mock Service Worker) for API mocking. For detailed setup and usage, refer to [MSW Setup Guide](./TESTING_MSW_GUIDE.md).
    - Define mock responses for all API endpoints
    - Include error cases and edge cases
    - Mock both success and failure scenarios

2.  **Browser API Mocking**
    - Mock localStorage for state persistence
    - Mock clipboard API for copy operations
    - Mock window.matchMedia for theme preferences
    - Mock file system APIs for import/export

3.  **System API Mocking**
    - Mock prefers-color-scheme for theme detection
    - Mock window dimensions for desktop layout testing
    - Mock network status for offline testing

## TO-DO: Test Implementation Steps

### Phase 1: Setup and Infrastructure
- [x] Set up Vitest + RTL configuration
  - [x] Configure test environment
  - [x] Set up test utilities and helpers
  - [x] Configure test coverage reporting
  - [x] Set up MSW for API mocking

- [x] Set up Storybook configuration
  - [x] Configure theme switching
  - [x] Set up viewport testing
  - [x] Configure accessibility testing
  - [x] Set up documentation

### Phase 2: Utility and Hook Tests
- [ ] Implement tests for utility functions
  - [ ] `highlightText` utility
  - [ ] `getRoleChipColor` helper
  - [x] Other utility functions

- [x] Implement tests for custom hooks
  - [x] `useLocalStorage` hook
  - [x] `useChannelStatus` hook
  - [x] Other custom hooks

### Phase 3: Leaf Component Tests
- [x] Implement `ChannelCard` tests
  - [x] Vitest + RTL tests for behavior
  - [x] Storybook stories for visual states
  - [ ] Accessibility tests

- [ ] Implement `StreamKeyDialog` tests
  - [x] Vitest + RTL tests for behavior (logic implemented, pathing issues remain)
  - [x] Storybook stories for visual states
  - [ ] Accessibility tests

### Phase 4: Container Component Tests
- [ ] Implement `ChannelList` tests
  - [ ] Vitest + RTL tests for behavior
  - [x] Storybook stories for visual states
  - [ ] Accessibility tests

- [ ] Implement `ChannelGroup` tests
  - [x] Vitest + RTL tests for behavior (logic implemented, pathing issues remain)
  - [x] Storybook stories for visual states
  - [ ] Accessibility tests

### Phase 5: Page Component Tests
- [ ] Implement `ChannelDashboard` tests
  - [ ] Vitest + RTL tests for behavior
  - [x] Storybook stories for visual states
  - [ ] Accessibility tests

- [x] Implement `ChannelConfiguration` tests
  - [x] Vitest + RTL tests for behavior
  - [x] Storybook stories for visual states
  - [ ] Accessibility tests

### Phase 6: Integration Tests
- [ ] Implement search functionality tests
  - [ ] Dashboard to ChannelCard integration
  - [ ] Search state management
  - [ ] Filter combinations

- [ ] Implement channel configuration flow tests
  - [ ] Add/Edit/Delete operations
  - [ ] Import/Export functionality
  - [ ] State persistence

### Phase 7: Accessibility and Visual Testing
- [ ] Implement comprehensive accessibility tests
  - [ ] Keyboard navigation
  - [ ] Screen reader compatibility
  - [ ] ARIA attributes
  - [ ] Focus management

- [ ] Implement visual regression tests
  - [ ] Theme variations
  - [ ] Desktop layout adjustments
  - [ ] Component states
  - [ ] Loading states

### Phase 8: Documentation and Review
- [ ] Document test patterns and best practices
  - [ ] Update TESTPLAN.md with lessons learned
  - [ ] Document common test patterns
  - [ ] Create test helper documentation

- [ ] Review and optimize
  - [ ] Review test coverage
  - [ ] Optimize test performance
  - [ ] Remove redundant tests
  - [ ] Update documentation

### Success Criteria
- [ ] All test scenarios from TESTSCENARIOS.md are implemented
- [ ] Test coverage meets or exceeds 80% for critical paths
- [ ] All accessibility requirements are verified
- [ ] Visual testing covers all component states
- [ ] Integration tests cover all critical user flows
- [ ] Documentation is complete and up-to-date

## Test Scenarios
For detailed test scenarios for each component and system integration, refer to [TESTSCENARIOS.md](./TESTSCENARIOS.md). 