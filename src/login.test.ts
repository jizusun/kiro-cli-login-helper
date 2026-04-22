import { test, expect, mock } from "bun:test";
import { createCheckAndLogin } from "./login";

test("does not trigger login when already logged in", async () => {
  const checkLoginFn = mock(() => Promise.resolve(true));
  const loginFn = mock(() => Promise.resolve(true));
  const checkAndLogin = createCheckAndLogin(checkLoginFn, loginFn);

  await checkAndLogin();

  expect(checkLoginFn).toHaveBeenCalledTimes(1);
  expect(loginFn).toHaveBeenCalledTimes(0);
});

test("triggers login when not logged in", async () => {
  const checkLoginFn = mock(() => Promise.resolve(false));
  const loginFn = mock(() => Promise.resolve(true));
  const checkAndLogin = createCheckAndLogin(checkLoginFn, loginFn);

  await checkAndLogin();

  expect(loginFn).toHaveBeenCalledTimes(1);
});

test("prevents concurrent login attempts", async () => {
  const checkLoginFn = mock(() => Promise.resolve(false));
  const loginFn = mock(() => new Promise<boolean>(resolve => setTimeout(() => resolve(true), 100)));
  const checkAndLogin = createCheckAndLogin(checkLoginFn, loginFn);

  const promise1 = checkAndLogin();
  await checkAndLogin();
  await promise1;

  expect(loginFn).toHaveBeenCalledTimes(1);
});

test("resets lock on error", async () => {
  const checkLoginFn = mock(() => Promise.resolve(false));
  const loginFn = mock(() => Promise.reject(new Error("fail")));
  const checkAndLogin = createCheckAndLogin(checkLoginFn, loginFn);

  await checkAndLogin().catch(() => {});
  checkLoginFn.mockImplementation(() => Promise.resolve(true));
  await checkAndLogin();

  expect(checkLoginFn).toHaveBeenCalledTimes(2);
});

test("watch mode passes watch and expiresMs to loginFn", async () => {
  const checkLoginFn = mock(() => Promise.resolve(false));
  const loginFn = mock(() => Promise.resolve(true));
  const checkAndLogin = createCheckAndLogin(checkLoginFn, loginFn, true, 60000, 600000);

  await checkAndLogin();

  expect(loginFn).toHaveBeenCalledWith(true, 600000);
});

test("on-demand mode passes false and default expiresMs to loginFn", async () => {
  const checkLoginFn = mock(() => Promise.resolve(false));
  const loginFn = mock(() => Promise.resolve(true));
  const checkAndLogin = createCheckAndLogin(checkLoginFn, loginFn);

  await checkAndLogin();

  expect(loginFn).toHaveBeenCalledWith(false, 600000);
});

test("triggers login immediately every check when not logged in", async () => {
  const checkLoginFn = mock(() => Promise.resolve(false));
  const loginFn = mock(() => Promise.resolve(false));
  const checkAndLogin = createCheckAndLogin(checkLoginFn, loginFn);

  await checkAndLogin();
  await checkAndLogin();

  expect(loginFn).toHaveBeenCalledTimes(2);
});
