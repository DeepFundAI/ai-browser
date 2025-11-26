import { session } from 'electron';
import { DEFAULT_PORT } from './constants';
import { store } from './store';

export async function initCookies() {
  await loadStoredCookies();
}

export async function storeCookies(cookies: Electron.Cookie[]) {
  for (const cookie of cookies) {
    store.set(`cookie:${cookie.name}`, cookie);
  }
}

async function loadStoredCookies() {
  const cookieKeys = store.store ? Object.keys(store.store).filter((key) => key.startsWith('cookie:')) : [];

  for (const key of cookieKeys) {
    const cookie = store.get(key);
    if (cookie) {
      const cookieWithUrl = {
        ...cookie,
        url: cookie.url || `http://localhost:${DEFAULT_PORT}`,
      };
      await session.defaultSession.cookies.set(cookieWithUrl).catch(error => {
        console.error(`[Cookie] Failed to set ${key}:`, error);
      });
    }
  }
}
