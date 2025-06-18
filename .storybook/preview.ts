import type { Preview } from '@storybook/react'
import { initialize, mswLoader } from 'msw-storybook-addon'
import { http, HttpResponse } from 'msw'

// Initialize MSW
initialize()

export const globalMswHandlers = [
    http.post('http://localhost:3000/api/v1/statuses', () => {
      return HttpResponse.json({ channels: [] });
    }),
    http.get('http://localhost:3000/api/v1/getStreamKey', () => {
        return HttpResponse.json({ streamKey: 'fake_stream_key' });
    }),
];

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    },
    msw: {
      handlers: globalMswHandlers,
    }
  },
  loaders: [mswLoader],
};

export default preview;