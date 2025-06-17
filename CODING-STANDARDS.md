# Coding Standards

This document outlines the coding standards and best practices to be followed in this project. Adhering to these guidelines will help maintain a clean, consistent, and maintainable codebase.

## Guiding Principles

- **Component-Based Architecture**: Decompose features into small, reusable, and single-responsibility components.
- **Separation of Concerns**: Keep business logic, state management, and view/UI rendering separate.
- **DRY (Don't Repeat Yourself)**: Abstract and reuse code where possible, especially through utility functions and custom hooks.
- **Clarity and Readability**: Write code that is easy to understand. Self-documenting code is preferred over excessive comments.
- **Declarative over Imperative**: Prefer declarative programming styles (e.g., using `.map()`, `.filter()`, `.reduce()`) over imperative loops (`for`, `while`) for data and array transformations. This often leads to more readable and maintainable code.
    - **Bad**: An imperative `for` loop that manually builds a new array.
    - **Good**: Using `.split()` and `.map()` to transform a string into an array of React components, as seen in the `highlightText` function in `ChannelCard.tsx`.

---

## File and Naming Conventions

1.  **Component Files**:
    -   Name: `PascalCase.tsx` (e.g., `ChannelCard.tsx`).
    -   Component Name: `PascalCase` (e.g., `export const ChannelCard = ...`).

2.  **Non-Component Files**:
    -   Name: `camelCase.ts` (e.g., `channelUtils.ts`, `useChannelManagement.ts`).
    -   This includes hooks, utilities, contexts, and service files.

3.  **Directory/Folder Names**:
    -   Name: `PascalCase` for component folders, `camelCase` for others.
    -   Examples: `src/components/ChannelCard`, `src/hooks`, `src/utils`.

4.  **Test Files**:
    -   Name: Match the file they are testing, with a `.test` suffix.
    -   Examples: `ChannelCard.test.tsx`, `useChannelManagement.test.ts`.

5.  **Constants**:
    -   Exported constants should be `UPPER_SNAKE_CASE`.
    -   Example: `export const CHANNEL_VIEWS = [...]`.

---

## Component Design

A well-structured component focuses on a single responsibility. The `ChannelCard` component is a good reference.

- **Decomposition**: Break down large components into smaller, more manageable ones.
    -   **Bad**: A single large component file that handles UI, state, and complex logic (`ChannelConfiguration.tsx`).
    -   **Good**: A main component that composes smaller sub-components, each with a clear purpose (`ChannelCard.tsx`). The toolbar in `ChannelDashboard` should be its own component.

- **Data Flow**: Data should flow from parent to child components via props.
    -   **Bad**: A child component re-fetching data from a context when the parent already has it (`ChannelGroup.tsx`). This creates unnecessary coupling and makes components less reusable.
    -   **Good**: The parent component fetches or computes data and passes the relevant parts down to its children as props.

- **Logic Abstraction**: Business logic should be extracted from components.
    -   Use **custom hooks** (`use...`) to manage component state and side effects (e.g., `useChannelManagement.ts`).
    -   Use **utility functions** (`/utils/...`) for pure data transformations (e.g., `applyFilters`, `transformImportedConfig`).
    -   **Bad**: Complex logic like file parsing (`handleImport`) or data filtering (`useMemo` in `ChannelDashboard`) directly inside a UI component.
    -   **Good**: Component calls a hook function (`importChannels(data)`) and the hook contains the complex logic.

- **Layout and Subcomponents**: For complex components, consider separating layout, subcomponents, utility functions, and the main component logic within the file using comments for clarity.

```tsx
// src/components/MyComponent/MyComponent.tsx

// ================ Types ================
export interface MyComponentProps { ... }

// ================ Layout ================
const MyComponentLayout = ({...}) => ( ... );

// ================ Subcomponents ================
const HelperButton = ({...}) => ( ... );

// ================ Main Component ================
export const MyComponent = ({...}) => {
    // hooks and state
    // handlers
    // return <MyComponentLayout ... />
}
```

---

## State Management

- **`useState`**: Use for simple, local component state (e.g., toggling a dialog).
- **`useReducer`**: Use when state logic is complex or the next state depends on the previous one.
- **Context with Reducers/Hooks**: Use a combination of React Context and custom hooks to provide global state and functionality, avoiding prop-drilling (e.g., `ChannelContext`, `useChannelManagement`).

---

## Imports

To keep imports clean and readable, we use path aliases.

- **Path Alias**: Always use `@/` for absolute imports from the `src` directory.
    -   **Bad**: `import { useChannels } from '../../../../contexts/ChannelContext';`
    -   **Good**: `import { useChannels } from '@/contexts/ChannelContext';`

- **Order**: Group and order imports as follows, with a new line between groups.
    1.  React imports (`import React from 'react'`)
    2.  Third-party library imports (e.g., `@mui/material`)
    3.  Absolute project imports using `@/` (e.g., `@/components/...`)
    4.  Relative imports (`./components/...`)
    5.  Type imports (`import type ...`)

---

## Testing

- **Unit Tests**: Every hook and utility function should have unit tests.
- **Component Tests**: Every component should have tests covering its states and user interactions. Use `@testing-library/react`.
- **Storybook**: Create stories for components to document their appearance and behavior in isolation. Interaction tests can be added to stories to verify functionality.

---

## General Practices

- **TypeScript**: Use TypeScript for all new code. Define clear types and interfaces for props, state, and API payloads (`/types/schema.ts`).
- **Styling**: Use MUI's `sx` prop or `styled()` for component-specific styles. Avoid inline `style` attributes.
- **Linting**: Adhere to the configured ESLint rules. Run the linter before committing code.
- **Destructuring**: Destructure props and objects for better readability.
- **UI Design**: prefer Grid over Box. Exception is for simple 1D elements.

---

## Refactoring To-Do

This section lists the high-priority refactoring tasks required to align the existing codebase with these standards.

1.  **Configure Path Aliasing**:
    -   [ ] Add `baseUrl` and `paths` to `tsconfig.json` to enable `@/` imports.
    -   [ ] Add a corresponding `resolve.alias` to `vite.config.ts`.

2.  **Update Import Paths**:
    -   [ ] Once path aliasing is configured, refactor all `import` statements to use the `@/` alias instead of long relative paths.

3.  **Refactor "Bad" Components**:
    -   [ ] **`ChannelConfiguration.tsx`**:
        -   [ ] Extract the complex `handleImport` logic into the `useChannelManagement` hook. The component should only be responsible for opening the file dialog and calling the hook.
        -   [ ] Decompose the UI into smaller subcomponents (e.g., an `ImportExportButtons` component).
    -   [ ] **`ChannelDashboard.tsx`**:
        -   [ ] Decompose the `Toolbar` into a separate `DashboardToolbar` component to encapsulate the filter controls.
        -   [ ] Move the `visibleGroups` filtering logic into a custom hook or a selector-like utility function.
    -   [ ] **`ChannelGroup.tsx`**:
        -   [ ] Remove the component's dependency on `useChannels` and `useChannelFilter` contexts.
        -   [ ] Refactor the component to receive the filtered list of channels directly as a prop from its parent (`ChannelDashboard`), making it a "presentational" component.
