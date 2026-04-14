import { test, expect, mock } from "bun:test";
import { createCheckAndLogin } from "./monitor";

test("does not trigger login when already logged in", async () => {
  const checkLoginFn = mock(() => Promise.resolve(true));
  const loginFn = mock(() => Promise.resolve());
  const checkAndLogin = createCheckAndLogin(checkLoginFn, loginFn);

  await checkAndLogin();

  expect(checkLoginFn).toHaveBeenCalledTimes(1);
  expect(loginFn).toHaveBeenCalledTimes(0);
});

test("triggers login when not logged in", async () => {
  const checkLoginFn = mock(() => Promise.resolve(false));
  const loginFn = mock(() => Promise.resolve());
  const checkAndLogin = createCheckAndLogin(checkLoginFn, loginFn);

  await checkAndLogin();

  expect(loginFn).toHaveBeenCalledTimes(1);
});

test("prevents concurrent login attempts", async () => {
  const checkLoginFn = mock(() => Promise.resolve(false));
  const loginFn = mock(() => new Promise(resolve => setTimeout(resolve, 100)));
  const checkAndLogin = createCheckAndLogin(checkLoginFn, loginFn);

  const promise1 = checkAndLogin();
  await checkAndLogin();
  await promise1;

  expect(checkLoginFn).toHaveBeenCalledTimes(1);
  expect(loginFn).toHaveBeenCalledTimes(1);
});

test("skips multiple interval ticks during long login", async () => {
  const checkLoginFn = mock(() => Promise.resolve(false));
  const loginFn = mock(() => new Promise(resolve => setTimeout(resolve, 200)));
  const checkAndLogin = createCheckAndLogin(checkLoginFn, loginFn);

  const promise1 = checkAndLogin();
  await checkAndLogin();
  await checkAndLogin();
  await checkAndLogin();
  await promise1;

  expect(loginFn).toHaveBeenCalledTimes(1);
});

test("resets lock on error", async () => {
  const checkLoginFn = mock(() => Promise.resolve(false));
  const loginFn = mock(() => Promise.reject(new Error("fail")));
  const checkAndLogin = createCheckAndLogin(checkLoginFn, loginFn);

  await checkAndLogin().catch(() => {});
  // Should be able to run again after error
  checkLoginFn.mockImplementation(() => Promise.resolve(true));
  await checkAndLogin();

  expect(checkLoginFn).toHaveBeenCalledTimes(2);
});
