import { set, refresh } from '../core/store';
import { $, toast, action } from '../core/ui';
import { ic } from '../core/icons';
import { authService } from '../domain/auth/auth.service';
import { REGIONAL_HUBS } from '../domain/logistics/network';

const state = {
  loading: false,
  mode: 'login' as 'login' | 'signup',
  error: '',
  selectedRegion: 'Africa' as string
};

function render(S: any) {
  const isSignup = state.mode === 'signup';
  
  return `
    <div class="auth-container">
      <div class="auth-header">
        <div class="auth-logo">NEXHAUL</div>
        <div class="auth-sublogo">LOGISTICS</div>
        <div class="auth-tagline">Elite Trucking Empire</div>
      </div>

      <div class="auth-card">
        <div class="auth-tabs">
          <button class="auth-tab ${!isSignup ? 'on' : ''}" data-act="authMode" data-mode="login">Login</button>
          <button class="auth-tab ${isSignup ? 'on' : ''}" data-act="authMode" data-mode="signup">Register</button>
        </div>

        ${state.error ? `<div class="auth-error">${state.error}</div>` : ''}

        <div class="auth-form">
          <div class="auth-input-group">
            <span class="auth-input-icon">${ic('user')}</span>
            <input type="text" id="auth-user" class="auth-input" placeholder="Username" autocomplete="off">
          </div>

          <div class="auth-input-group">
            <span class="auth-input-icon">${ic('bolt')}</span>
            <input type="password" id="auth-pass" class="auth-input" placeholder="Passcode" autocomplete="off">
          </div>

          ${isSignup ? `
            <div class="auth-input-group">
              <span class="auth-input-icon">${ic('company')}</span>
              <input type="text" id="auth-company" class="auth-input" placeholder="Company Name (e.g. Apex Freight)" autocomplete="off">
            </div>

            <div class="auth-input-group">
              <span class="auth-input-icon">${ic('tag')}</span>
              <input type="text" id="auth-initials" class="auth-input" placeholder="Company Initials (e.g. APX)" maxlength="4" autocomplete="off">
            </div>

            <div style="margin-bottom:12px;">
              <label style="font-size:11px; color:var(--mu); font-weight:700; display:block; margin-bottom:4px;">Starting Region</label>
              <select id="auth-region" class="auth-input" style="background:var(--bg); color:var(--tx); cursor:pointer;" data-act="changeRegion">
                <option value="Africa" ${state.selectedRegion === 'Africa' ? 'selected' : ''}>Africa</option>
                <option value="Europe" ${state.selectedRegion === 'Europe' ? 'selected' : ''}>Europe</option>
                <option value="America" ${state.selectedRegion === 'America' ? 'selected' : ''}>North America</option>
                <option value="Asia" ${state.selectedRegion === 'Asia' ? 'selected' : ''}>Asia</option>
              </select>
            </div>

            <div style="margin-bottom:12px;">
              <label style="font-size:11px; color:var(--mu); font-weight:700; display:block; margin-bottom:4px;">Initial Headquarters / Free Hub</label>
              <select id="auth-hub" class="auth-input" style="background:var(--bg); color:var(--tx); cursor:pointer;">
                ${REGIONAL_HUBS.filter(h => h.region === state.selectedRegion).map(h => `
                  <option value="${h.id}">${h.name} (${h.city}) - Free HQ</option>
                `).join('')}
              </select>
            </div>
          ` : ''}

          <button class="btn gold ${state.loading ? 'loading' : ''}" data-act="authSubmit">
            ${state.loading ? '<div class="spinner"></div>' : (isSignup ? 'Establish Empire' : 'Access Terminal')}
          </button>

          <button class="btn alt" style="font-size:11px; padding:10px; border-color:rgba(193,154,91,0.4);" data-act="authQuickPlay">
            Direct Access: ${S.company || 'NexHaul Logistics'}
          </button>
        </div>
      </div>

      <div class="auth-footer">
        v1.0.4 · Systems Online
      </div>
    </div>
  `;
}

action('authQuickPlay', () => {
  set(s => {
    s.isAuthenticated = true;
  });
  toast('Access Granted: Director Terminal Online', 'success');
  refresh();
});

action('changeRegion', (d, el) => {
  const select = el as HTMLSelectElement;
  if (select) {
    state.selectedRegion = select.value;
    set(s => s);
  }
});

action('authSubmit', async () => {
  if (state.loading) return;
  
  const user = ($('auth-user') as HTMLInputElement)?.value;
  const pass = ($('auth-pass') as HTMLInputElement)?.value;
  const company = ($('auth-company') as HTMLInputElement)?.value;

  if (!user || !pass) {
    state.error = 'Identification required';
    return set(s => s);
  }

  state.loading = true;
  state.error = '';
  set(s => s);

  try {
    if (state.mode === 'signup') {
      const company = ($('auth-company') as HTMLInputElement)?.value;
      const initials = ($('auth-initials') as HTMLInputElement)?.value || company.substring(0, 3).toUpperCase();
      const region = ($('auth-region') as HTMLSelectElement)?.value || 'Africa';
      const hubId = ($('auth-hub') as HTMLSelectElement)?.value || REGIONAL_HUBS.find(h => h.region === region)?.id || 'hub_lagos';

      if (!company) throw new Error('Company name required');
      await authService.register(user, pass, company, initials, region, hubId);
      toast('Registration Successful', 'success');
      toast('Welcome, Director ' + user);
    } else {
      const success = await authService.login(user, pass);
      if (!success) throw new Error('Invalid Credentials');
      toast('Login Successful', 'success');
      toast('Welcome back, Director');
    }
    
    // Auth service handles state.isAuthenticated = true
    // Reload to boot the game engine
    setTimeout(() => location.reload(), 1000);
  } catch (err: any) {
    state.loading = false;
    state.error = err.message || 'Connection failed';
    toast(state.error, 'err');
    set(s => s);
  }
});

export default { render };
