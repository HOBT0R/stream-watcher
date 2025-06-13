# Stream Watcher

A React-based frontend application for monitoring Twitch channel statuses. This application provides a clean, intuitive interface for tracking multiple Twitch channels, their live status, and managing stream keys.

## Features
- Real-time monitoring of Twitch channel status
- Dark and Light mode support with system preference detection
- Channel grouping and management through the UI
- Import/Export of channel configurations
- Filtering by online/offline status, role, and text search
- Built with React, TypeScript, and Material-UI

## Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher

## Quick Start
1. Clone the repository
```bash
git clone https://github.com/rapidraptor/stream-watcher.git
cd stream-watcher
```

2. Install dependencies
```bash
npm install
```

3. Start development server
```bash
npm run dev
```

## Architecture Overview

This application is built with a modern React architecture, emphasizing separation of concerns through hooks and contexts.

### Core Concepts

- **State Management**:
    - **`useLocalStorage`**: A custom hook that persists state to the browser's local storage, used for channel configurations and theme preferences.
    - **`useChannelManagement`**: A hook that centralizes all logic for managing channels (add, update, delete, import, export).
    - **`useChannelStatus`**: A hook responsible for polling the backend to get the online/offline status of channels.

- **Contexts**:
    - **`ThemeContext`**: Provides theme-related state (`isDarkMode`) and functions (`toggleTheme`) to the entire application. It also detects the user's system preference for dark mode.
    - **`ChannelContext`**: A comprehensive context that manages all channel-related state. It integrates `useChannelManagement` and `useChannelStatus` to provide a single source of truth for channel data, statuses, and management functions.

### Project Structure
```
stream-watcher/
├── src/
│   ├── components/
│   │   ├── ChannelConfiguration/
│   │   ├── ChannelDashboard/
│   │   ├── ChannelGroup/
│   │   ├── MainLayout/
│   │   ├── NavButton/
│   │   ├── ThemeToggle/
│   │   └── TopBar/
│   ├── contexts/
│   │   ├── ChannelContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/
│   │   ├── useChannelManagement.ts
│   │   ├── useChannelStatus.ts
│   │   └── useLocalStorage.ts
│   ├── services/
│   │   └── api/
│   ├── types/
│   ├── utils/
│   └── config/
└── README.md
```

### Component Breakdown

-   **`App.tsx`**: The root component, responsible for setting up the main theme and `ChannelProvider`.
-   **`MainLayout.tsx`**: The primary layout component that organizes the `TopBar` and the main content area, switching between the `ChannelDashboard` and `ChannelConfiguration` views based on the active tab.
-   **`TopBar.tsx`**: The application's header, containing navigation buttons and the `ThemeToggle` component.
-   **`ChannelDashboard`**: The main view for displaying channel statuses. It uses the `useChannels` hook to get the latest channel states and provides filtering options.
-   **`ChannelConfiguration`**: The view for managing channels. It uses the `useChannelManager` hook to interact with the channel list (add, update, delete, etc.).
-   **`ThemeToggle`**: A simple switch component for toggling between light and dark modes.

## Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run lint` - Run linter

## Configuration

### Default Channels
The application comes with a set of default channels that are used when no configuration has been saved. You can modify these defaults by editing the `src/config/defaults.json` file:

```json
{
    "channels": {
        "channelName": {
            "channelName": "channelName",
            "displayName": "Display Name",
            "group": "Group Name",
            "description": "Channel description",
            "isActive": true
        }
    },
    "preferences": {
        "viewMode": "grid",
        "pollInterval": 60,
        "showOffline": true
    }
}
```

Each channel configuration requires:
- `channelName`: The Twitch channel name (used as the unique identifier)
- `displayName`: Optional display name (defaults to channelName if not provided)
- `group`: The group this channel belongs to
- `description`: Optional description of the channel
- `isActive`: Whether to actively monitor this channel

The preferences section configures:
- `viewMode`: Display mode ("grid" or "list")
- `pollInterval`: How often to check channel status (in seconds)
- `showOffline`: Whether to show offline channels

Note: These defaults are only used when no configuration has been saved in the browser's localStorage. Once a user makes changes through the UI, their configuration will be saved and used instead of these defaults.

### Managing Channels

The Stream Watcher application allows you to manage your monitored channels directly through the UI on the "Configuration" tab. Here's how to use its features:

*   **Add a New Channel:**
    1.  Navigate to the "Configuration" tab.
    2.  Click the "Add Channel" button.
    3.  A dialog will appear where you can enter the `Channel Name` (Twitch ID), an optional `Display Name`, select or add a `Group`, provide an optional `Description`, and assign a `Role`.
    4.  Click "Save" to add the channel.

*   **Edit an Existing Channel:**
    1.  Navigate to the "Configuration" tab.
    2.  Locate the channel you wish to edit in the list.
    3.  Click the "Edit" (pencil) icon next to the channel.
    4.  A dialog will appear pre-filled with the channel's current information. You can modify the `Display Name`, `Group`, `Description`, `Role`, and `Active` status. The `Channel Name` cannot be changed.
    5.  Click "Save" to apply your changes.

*   **Delete a Channel:**
    1.  Navigate to the "Configuration" tab.
    2.  Locate the channel you wish to delete in the list.
    3.  Click the "Delete" (trash can) icon next to the channel.
    4.  Confirm the deletion if prompted.

*   **Import Channels:**
    1.  Navigate to the "Configuration" tab.
    2.  Click the "Import" button.
    3.  Select a `.json` file from your computer that contains the full application configuration (channels and preferences). This file should adhere to the `AppConfig` schema, as detailed in the [Default Channels](#default-channels) section.
    4.  The imported configuration will overwrite your current channel list and preferences.

*   **Export Channels:**
    1.  Navigate to the "Configuration" tab.
    2.  Click the "Export" button.
    3.  A `.json` file named `stream-watcher-config.json` containing your current `AppConfig` (channel list and preferences) will be downloaded to your computer, structured as described in the [Default Channels](#default-channels) section.

## Brand Color Palette

### Speedromizer Darkmode
Inspired by the neon slot reel image.
*   Primary Color: Electric Purple — `#A100FF`
    Sets the retro-futuristic, arcade tone.
*   Secondary Color: Neon Yellow — `#FFD700`
    Used for glowing highlights and attention-drawing text.
*   Accent Color: Neon Green — `#00FF66`
    Adds motion and energy with directional cues.

### Speedromizer Lightmode
Inspired by the cartoon-style slot machine.
*   Primary Color: Candy Apple Red — `#D32F2F`
    Dominates the design and gives a bold, inviting feel.
*   Secondary Color: Golden Yellow — `#FFD700`
    Provides contrast and enhances the game-show vibe.
*   Accent Color: Lime Green — `#00C853`
    Adds freshness and helps signal interactivity.

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.
