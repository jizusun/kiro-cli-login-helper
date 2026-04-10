import { test, expect, mock } from "bun:test";
import { checkAndLogin } from "./monitor";

test("checkAndLogin does not trigger login when already logged in", async () => {
  const isLoggingIn = { value: false };
  const checkLoginFn = mock(() => Promise.resolve(true));
  const loginFn = mock(() => Promise.resolve());

  await checkAndLogin(isLoggingIn, checkLoginFn, loginFn);

  expect(checkLoginFn).toHaveBeenCalledTimes(1);
  expect(loginFn).toHaveBeenCalledTimes(0);
  expect(isLoggingIn.value).toBe(false);
});

test("checkAndLogin triggers login when not logged in", async () => {
  const isLoggingIn = { value: false };
  const checkLoginFn = mock(() => Promise.resolve(false));
  const loginFn = mock(() => Promise.resolve());

  await checkAndLogin(isLoggingIn, checkLoginFn, loginFn);

  expect(checkLoginFn).toHaveBeenCalledTimes(1);
  expect(loginFn).toHaveBeenCalledTimes(1);
  expect(isLoggingIn.value).toBe(false);
});

test("checkAndLogin prevents concurrent login attempts", async () => {
  const isLoggingIn = { value: false };
  const checkLoginFn = mock(() => Promise.resolve(false));
  const loginFn = mock(() => new Promise(resolve => setTimeout(resolve, 100)));

  // Start first login (doesn't await)
  const promise1 = checkAndLogin(isLoggingIn, checkLoginFn, loginFn);
  
  // Try second login immediately
  await checkAndLogin(isLoggingIn, checkLoginFn, loginFn);
  
  await promise1;

  expect(checkLoginFn).toHaveBeenCalledTimes(2);
  expect(loginFn).toHaveBeenCalledTimes(1); // Only called once due to lock
});
