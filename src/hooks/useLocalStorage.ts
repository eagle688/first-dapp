// hooks/useLocalStorage.ts
import { useState } from "react";

/**
 * 本地存储的 Hook
 * 用于存储用户偏好设置
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // 从 localStorage 读取初始值
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`读取 localStorage 键 "${key}" 时出错:`, error);
      return initialValue;
    }
  });

  // 返回的 setter 函数会同时更新 state 和 localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // 允许值是一个函数，这样我们就可以使用之前的 state
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`设置 localStorage 键 "${key}" 时出错:`, error);
    }
  };

  return [storedValue, setValue] as const;
}
