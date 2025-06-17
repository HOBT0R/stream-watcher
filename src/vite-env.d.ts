/// <reference types="vite/client" />

import { SetupWorkerApi } from 'msw/browser';

declare global {
    interface Window {
        msw: {
            worker: SetupWorkerApi;
            // You can add any other MSW properties you need here
        };
    }
}
