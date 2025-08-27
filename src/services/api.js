// Mock API service
const api = {
  get: (url) => {
    console.log(`Fetching data from ${url}`);
    return Promise.resolve({ data: [] });
  },
  post: (url, data) => {
    console.log(`Posting data to ${url}`, data);
    return Promise.resolve({ data: { success: true } });
  },
  put: (url, data) => {
    console.log(`Putting data to ${url}`, data);
    return Promise.resolve({ data: { success: true } });
  }
};

export default api;
