import { set } from '../../core/store';
import { UserAccount } from './auth.types';
import { pushNote } from '../../systems/notify';
import { getWelcomeMessage } from '../notifications/templates/welcome';
import { REGIONAL_HUBS } from '../logistics/network';

const ACCOUNTS_KEY = 'sam.accounts.v1';

export function getAccounts(): UserAccount[] {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

export function saveAccount(account: UserAccount) {
  const accounts = getAccounts();
  const existingIndex = accounts.findIndex(
    a => a.username.toLowerCase() === account.username.toLowerCase()
  );
  if (existingIndex >= 0) {
    accounts[existingIndex] = account;
  } else {
    accounts.push(account);
  }
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export const authService = {
  async login(username: string, pass: string): Promise<boolean> {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));
    
    const accounts = getAccounts();
    const query = username.trim().toLowerCase();
    const account = accounts.find(a => a.username.toLowerCase() === query);
    
    if (account && account.passwordHash === pass) {
      set(s => {
        s.isAuthenticated = true;
        s.company = account.companyName || s.company;
      });
      return true;
    }
    return false;
  },

  async register(username: string, pass: string, company: string, initials: string, startingRegion: string, startingHubId: string): Promise<void> {
    await new Promise(r => setTimeout(r, 1200));
    
    const accounts = getAccounts();
    if (accounts.some(a => a.username.toLowerCase() === username.toLowerCase())) {
      throw new Error(`Username "${username}" already exists. Please choose another username or log in.`);
    }

    const hub = REGIONAL_HUBS.find(h => h.id === startingHubId) || REGIONAL_HUBS[0];

    const newAccount: UserAccount = {
      username,
      passwordHash: pass,
      companyName: company,
      companyInitials: initials,
      startingRegion,
      startingHubId: hub.id,
      email: `${username}@nexhaul.com`,
      createdAt: Date.now()
    };

    saveAccount(newAccount);
    
    set(s => {
      s.isAuthenticated = true;
      s.company = company;
      s.companyInitials = initials;
      s.hqCity = hub.city;
      s.depots = [hub.id];
      s.unlockedRegions = [startingRegion || hub.region];
      s.hubFacilities = {
        [hub.id]: { owned: true, bays: 2, fuel: 15000, repairBay: true }
      };
      if (s.fleet && s.fleet.length > 0) {
        s.fleet[0].loc = hub.city;
      }

      const welcome = getWelcomeMessage({
        companyName: company,
        hqCity: hub.city,
        startingCapital: s.money || 150000
      });
      pushNote(s, welcome.msg, {
        title: welcome.title,
        type: 'system',
        priority: 2,
        body: welcome.body
      });
    });
  }
};
