import '@testing-library/jest-dom';

// Mock scrollIntoView as jsdom doesn't implement it
window.HTMLElement.prototype.scrollIntoView = function() {};
