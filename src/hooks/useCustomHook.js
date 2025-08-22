import { useState, useEffect } from 'react';

// Example custom hook
const useCustomHook = (initialValue) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    // Some logic here
  }, [value]);

  return [value, setValue];
};

export default useCustomHook;
