# Context Requirements

## 1. ChannelContext

### Purpose
Manages the list of channels and all channel-related actions (add, update, delete, import, export). Provides state and dispatch/actions to any component that needs to read or modify channel data.

### Props (Provider)
- **children**: `React.ReactNode` — The subtree that will have access to the context.

### State Provided
- **channels**: `ChannelConfig[]` — The current list of channels.
- **channelStates**: `ChannelState[]` — The current state (status, etc.) of each channel.

### Actions/Dispatch Provided
- **addChannel(channel: ChannelConfig): void**
- **updateChannel(channel: ChannelConfig): void**
- **deleteChannel(channelName: string): void**
- **importChannels(channels: ChannelConfig[]): void**
- **exportChannels(): ChannelConfig[]**

### Return Value (from useChannelContext/useChannels)
```ts
{
  channels: ChannelConfig[];
  channelStates: ChannelState[];
  addChannel: (channel: ChannelConfig) => void;
  updateChannel: (channel: ChannelConfig) => void;
  deleteChannel: (channelName: string) => void;
  importChannels: (channels: ChannelConfig[]) => void;
  exportChannels: () => ChannelConfig[];
}
```

### Where Used
- `MainLayout` (Provider wraps the app or main layout)
- `ChannelDashboard`
- `ChannelConfiguration`
- `ChannelGroup`
- `ChannelList`
- `ChannelCard`
- Any component that needs to read or modify channel data

---

## 2. ChannelEditContext

### Purpose
Manages the state for editing a channel (e.g., which channel is being edited, open/close dialog, save/cancel actions).

### Props (Provider)
- **children**: `React.ReactNode`

### State Provided
- **editDialogOpen**: `boolean`
- **channelToEdit**: `ChannelConfig | null`

### Actions/Dispatch Provided
- **openChannelEditDialog(channel: ChannelConfig | null): void**
- **closeChannelEditDialog(): void**
- **saveChannel(channel: ChannelConfig): void**

### Return Value (from useChannelEdit)
```ts
{
  editDialogOpen: boolean;
  channelToEdit: ChannelConfig | null;
  openChannelEditDialog: (channel: ChannelConfig | null) => void;
  closeChannelEditDialog: () => void;
  saveChannel: (channel: ChannelConfig) => void;
}
```

### Where Used
- `ChannelEditDialog`
- `ChannelConfiguration`
- `ChannelCard`
- Any component that can trigger editing a channel

---

## 3. ChannelFilterContext

### Purpose
Manages the global filter state for the channel dashboard.

### Props (Provider)
- **children**: `React.ReactNode`

### State Provided
- **globalView**: `'all' | 'online' | 'offline'`
- **searchText**: `string`
- **roleFilter**: `'all' | Role`

### Actions/Dispatch Provided
- **setGlobalView**: `(view: 'all' | 'online' | 'offline') => void`
- **setSearchText**: `(text: string) => void`
- **setRoleFilter**: `(role: 'all' | Role) => void`

### Return Value (from useChannelFilter)
```ts
{
  globalView: 'all' | 'online' | 'offline';
  searchText: string;
  roleFilter: 'all' | Role;
  setGlobalView: (view: 'all' | 'online' | 'offline') => void;
  setSearchText: (text: string) => void;
  setRoleFilter: (role: 'all' | Role) => void;
}
```

### Where Used
- `ChannelDashboard`
- `ChannelGroup`

---

## 4. ThemeContext

### Purpose
Manages the current theme (light/dark) and provides a toggle.

### Props (Provider)
- **children**: `React.ReactNode`

### State Provided
- **theme**: `'light' | 'dark'`

### Actions/Dispatch Provided
- **toggleTheme(): void**

### Return Value (from useThemeContext)
```ts
{
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
```

### Where Used
- `ThemeToggle`
- Any component that needs to read or change the theme

## 5. VideoContext

### Purpose
Manages the global state for video playback, including which channels are currently playing an embedded Twitch stream. Enforces a concurrency limit (e.g., max 4 streams at once) and provides actions to start/stop playback.

### Props (Provider)
- **children**: `React.ReactNode`

### State Provided
- **playingVideos**: `string[]` — List of channel names currently playing video.

### Actions/Dispatch Provided
- **addPlayingVideo(channelName: string): void**
- **removePlayingVideo(channelName: string): void**

### Return Value (from useVideo)
```ts
{
  playingVideos: string[];
  addPlayingVideo: (channelName: string) => void;
  removePlayingVideo: (channelName: string) => void;
}
```

### Where Used
- `ChannelCard` (to determine if the video player should be shown)
- Any component that needs to know or control which channels are playing video




## Example Usage

```tsx
// In MainLayout.tsx
<ChannelContextProvider>
  <ChannelEditContextProvider>
    <ThemeContextProvider>
      {/* ...rest of app */}
    </ThemeContextProvider>
  </ChannelEditContextProvider>
</ChannelContextProvider> 
```

---

## Context Usage by Component


| Component             | ChannelContext | ChannelEditContext | ChannelFilterContext | ThemeContext | VideoContext |
|-----------------------|:--------------:|:------------------:|:--------------------:|:------------:|:------------:|
| MainLayout            | Provider only  | Provider only      | Provider only        | Provider only| Provider only|
| ChannelDashboard      | ✓              |                    | ✓ (sets)             |              |              |
| ChannelConfiguration  | ✓              | ✓                  |                      |              |              |
| ChannelGroup          | ✓              |                    | ✓ (reads)            |              |              |
| ChannelList           | ✓              |                    |                      |              |              |
| ChannelCard           | ✓              | ✓                  |                      |              | ✓            |
| ChannelEditDialog     | ✓              | ✓                  |                      |              |              |
| StreamKeyDialog       | ✓              |                    |                      |              |              |
| TopBar                |                |                    |                      | ✓            |              |
| ThemeToggle           |                |                    |                      | ✓            |              |


**Guiding Principle:**
- Only use a context in a component if it needs to read or update that context's state.
- Do not use context in higher-level components unless they directly need it.
- Wrap the app (or the relevant subtree) in the provider at the highest level needed, but consume the context only where required.