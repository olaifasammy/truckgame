import { set } from '../../core/store';
import { UserAccount } from './auth.types';

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

  async register(username: string, pass: string, company: string): Promise<void> {
    await new Promise(r => setTimeout(r, 1200));
    
    const accounts = getAccounts();
    if (accounts.some(a => a.username.toLowerCase() === username.toLowerCase())) {
      throw new Error('Username already exists');
    }

    const newAccount: UserAccount = {
      username,
      passwordHash: pass,
      companyName: company,
      email: `${username}@nexhaul.com`,
      createdAt: Date.now()
    };

    saveAccount(newAccount);
    
    set(s => {
      s.isAuthenticated = true;
      s.company = company;
    });
  }
};
