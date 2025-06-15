# Stream Watcher Test Scenarios

This document outlines the specific test scenarios for each component and for system integration in the Stream Watcher application.

## Component Test Scenarios

### Leaf Components

#### `ChannelCard`
- **Jest + RTL**
  - Copy channel name functionality
  - Stream key button rendering
    - Button is visible
    - Button has correct icon
    - Button has correct tooltip
    - Button is disabled when channel is offline
  - Stream key dialog opening
  - Twitch link behavior
  - Status updates
  - Error handling (verifying robust rendering and behavior when receiving malformed or incomplete channel data props)
  - Proper rendering of highlighted text when searchText prop is provided

- **Storybook**
  - Visual states (online/offline)
  - Role chip variations
  - Group tag variations
  - Theme variations
  - Desktop layout variations
  - Loading states
  - Search text highlighting variations
  - Stream key button states
    - Online state
    - Offline state
    - Hover state
    - Disabled state
    - Loading state

#### `StreamKeyDialog`
- **Jest + RTL**
  - Dialog open/close behavior
    - Opens when stream key button is clicked
    - Closes when close button is clicked
    - Closes when clicking outside
    - Closes when escape key is pressed
  - Dialog content rendering
    - Title is correct
    - Channel name is displayed
    - Loading indicator shows while fetching
    - Error message displays when fetch fails
    - Stream key is displayed when available
    - Copy button is present when stream key is available
  - Keyboard navigation
    - Focus management
    - Tab order
    - Escape key handling
  - Copy to clipboard functionality
    - Copy button is enabled when stream key is available
    - Success notification shows after copy
    - Error handling for clipboard operations

- **Storybook**
  - Dialog states
    - Initial state
    - Loading state
    - Success state (with mock stream key)
    - Error state (with mock error message)
  - Theme variations
    - Light mode
    - Dark mode
  - Desktop layout adjustments
  - Accessibility
    - Focus trap
    - ARIA attributes
    - Screen reader compatibility

### Container Components

#### `ChannelList`
- **Jest + RTL**
  - Empty state handling
  - Channel filtering (verifying it correctly displays the already filtered channels based on props)
  - Search functionality (verifying that the `searchText` prop is correctly used to highlight matching text within `ChannelCard`s)
  - Sort operations (verifying that the component correctly displays channels in the order provided by its props, implicitly sorted by parent components)
  - Error states (verifying that the component gracefully handles and displays error messages or states when data is unavailable or malformed due to upstream issues)

- **Storybook**
  - **Grid layout variations:**
    - Default grid layout with multiple channels.
    - Layout adjustments within desktop screen bounds (e.g., window resizing).
    - Visualization with varying numbers of channels (e.g., few, many).
  - **Loading states:**
    - Displaying a skeleton loader or placeholder cards while channels are being fetched.
    - Showing a clear loading indicator.
  - **Empty state visualization:**
    - When no channels are configured.
    - When all channels are filtered out by search.
    - When an upstream error prevents channels from loading.
  - **Desktop layout adjustments:**
    - How the grid adapts to desktop window width changes.
    - How individual channel cards resize within the desktop grid.
  - **Theme variations:**
    - Appearance in light mode.
    - Appearance in dark mode.

#### `ChannelGroup`
- **Jest + RTL**
  - Expand/collapse functionality
  - Channel counting
  - Online/offline filtering
  - Error handling (verifying that the component gracefully displays error states or empty messages when channel data is unavailable or filtered out by its logic due to upstream issues)

- **Storybook**
  - Expanded/collapsed states
  - **Group header variations:**
    - Different group names (e.g., 'A', 'B', 'HOST').
    - Displaying channel count (e.g., '5 Channels').
    - Displaying online channel count (e.g., '3 Online').
    - Header appearance when the group is empty (e.g., '0 Channels').
    - **Expand/Collapse Button Hover and Focus States:**
      - **Hover State:** Visual changes to the expand/collapse button when the mouse cursor is over it.
      - **Focus State:** Visual changes to the expand/collapse button when it receives keyboard focus (important for keyboard navigation and accessibility).
  - Loading states
  - Empty group states
  - Theme variations

### Page Components

#### `ChannelDashboard`
- **Jest + RTL**
  - Global search functionality
    - Search text propagation to child components
    - Search results filtering
    - Search state management
  - View toggle behavior
  - Role dropdown filtering (verifying channels are filtered correctly based on selected role)
  - Channel filtering (verifying the combined application of all active filters, including search, view toggles, and role dropdown, on the channel data)
  - Error handling (verifying display of user-friendly error messages for:
    - Network failures (e.g., no internet connection).
    - API failures (e.g., backend server issues, Twitch API errors, rate limiting).
    - Data loading issues (e.g., `localStorage` corruption, `defaults.json` parsing errors).
  )
  - State persistence

- **Storybook**
  - View variations (All/Online/Offline)
  - Role filter variations (verifying visual states when different roles are selected in the dropdown)
  - Search result states
    - Empty search results
    - Partial matches
    - Exact matches
    - Multiple matches
  - Loading states
  - Empty states
  - Theme variations

#### `ChannelConfiguration`
- **Jest + RTL**
  - Add/Edit/Delete operations
  - Form validation
  - **Import functionality:**
    - Successfully imports valid channel configuration JSON.
    - Successfully imports valid channel configuration JSON where `channels` is an object.
    - Handles import of malformed or invalid JSON structure.
    - Handles import of empty JSON.
  - **Export functionality:**
    - Successfully exports current channel configuration to JSON.
    - Ensures exported JSON matches current state.
  - Error handling (verifying display of user-friendly error messages during import/export operations, and general component errors)
  - State management

- **Storybook**
  - Dialog states
  - Form variations
  - Loading states
  - Error states
  - Theme variations

### Layout Components
- **Jest + RTL**
  - Desktop layout adjustments
  - Navigation state
  - Theme switching
  - **Keyboard navigation:**
    - Tab and Shift + Tab focus order through all interactive elements (search, toggles, dropdowns, buttons, links).
    - Enter/Space key activation of focused buttons, toggles, and selections in dropdowns.
    - Arrow key navigation within dropdown options and toggle groups.
    - Escape key to close dialogs and dismiss popovers (e.g., `StreamKeyDialog`).
  - Focus management (ensuring focus is trapped in modals, returns to triggers, and visual indicators are clear).

- **Storybook**
  - Desktop layout variations
  - Desktop layout breakpoints
  - Theme variations
  - Navigation states
  - Loading states

## Hook Test Scenarios

### `useLocalStorage`
- **Jest + RTL**
  - Initial state handling
    - Returns default value when no stored value exists
    - Returns stored value when it exists
  - State updates
    - Updates localStorage when value changes
    - Updates state when localStorage changes externally
  - Error handling
    - Handles localStorage being unavailable
    - Handles invalid JSON in localStorage
  - Type safety
    - Maintains correct TypeScript types
    - Handles type mismatches gracefully

### `useChannelStatus`
- **Jest + RTL**
  - Status tracking
    - Correctly tracks online/offline status
    - Updates status when channel state changes
  - Error handling
    - Handles API errors gracefully
    - Maintains last known state on error
  - Performance
    - Debounces status updates appropriately
    - Cleans up subscriptions on unmount
  - Integration
    - Works correctly with ChannelContext
    - Updates UI components properly

## System Integration / Manual Verification Considerations
These are important verification steps that interact with live backend services and external APIs (like Twitch API). They are **not part of the automated frontend test suite** described in this document, as all automated tests rely on mocked external calls. These typically involve manual testing or a separate system integration testing phase.

1.  **Stream Key Retrieval Verification**
    -   Manually verify successful retrieval with valid Twitch credentials.
    -   Manually verify error handling for:
        -   Invalid Twitch credentials
        -   Expired Twitch tokens
        -   Rate limiting
        -   Network failures
        -   Twitch API errors

2.  **Error Scenarios Verification**
    -   Manually verify specific error messages for different failure cases.
    -   Manually verify user-friendly error presentation.
    -   Manually verify recovery procedures.
    -   Manually verify retry mechanisms.

3.  **Security Considerations Verification**
    -   Manually verify stream key masking.
    -   Manually verify session handling.
    -   Manually verify token refresh.
    -   Manually verify rate limiting compliance. 