import '@testing-library/jest-dom';

declare global {
  const jest: typeof import('@jest/globals').jest;
  namespace NodeJS {
    interface Global {
      jest: typeof import('@jest/globals').jest;
    }
  }
} 