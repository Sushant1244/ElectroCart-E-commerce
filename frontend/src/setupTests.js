import '@testing-library/jest-dom';

// optional: any global mocks
window.matchMedia = window.matchMedia || function() {
  return { matches: false, addListener: () => {}, removeListener: () => {} };
};
