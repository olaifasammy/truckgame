import { set, refresh } from '../core/store';
import { $, toast, action } from '../core/ui';
import { ic } from '../core/icons';
import { authService } from '../domain/auth/auth.service';
import { REGIONAL_HUBS } from '../domain/logistics/network';

const state = {
  loading: false,
  mode: 'login' as 'login' | 'signup',
  error: '',
  signupStep: 1, // 1: Identity, 2: Territory, 3: Review
  selectedRegion: 'Africa' as string,
  selectedHubId: '' as string,
  userVal: '',
  passVal: '',
  companyVal: '',
  initialsVal: ''
};

function render(S: any) {
  const isSignup = state.mode === 'signup';
  const filteredHubs = REGIONAL_HUBS.filter(h => h.region === state.selectedRegion);
  const currentHub = filteredHubs.find(h => h.id === state.selectedHubId) || filteredHubs[0];

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
          <button class="auth-tab ${isSignup ? 'on' : ''}" data-act="authMode" data-mode="signup">New Company Wizard</button>
        </div>

        ${state.error ? `<div class="auth-error">${state.error}</div>` : ''}

        <div class="auth-form">
          ${!isSignup ? `
            <div class="auth-input-group">
              <span class="auth-input-icon">${ic('user')}</span>
              <input type="text" id="auth-user" class="auth-input" value="${state.userVal}" placeholder="Username" autocomplete="off">
            </div>

            <div class="auth-input-group">
              <span class="auth-input-icon">${ic('bolt')}</span>
              <input type="password" id="auth-pass" class="auth-input" value="${state.passVal}" placeholder="Passcode" autocomplete="off">
            </div>

            <button class="btn gold ${state.loading ? 'loading' : ''}" data-act="authSubmit">
              ${state.loading ? '<div class="spinner"></div>' : 'Access Terminal'}
            </button>
          ` : `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; font-size:11px; font-weight:700; color:var(--mu); border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:8px;">
              <span>STEP ${state.signupStep} OF 3: ${state.signupStep === 1 ? 'CORPORATE IDENTITY' : state.signupStep === 2 ? 'TERRITORY & HQ' : 'REVIEW & LAUNCH'}</span>
              <span style="color:var(--gold);">Step ${state.signupStep}/3</span>
            </div>

            ${state.signupStep === 1 ? `
              <div class="auth-input-group">
                <span class="auth-input-icon">${ic('company')}</span>
                <input type="text" id="auth-company" class="auth-input" value="${state.companyVal}" placeholder="Company Name (e.g. Apex Freight)" autocomplete="off">
              </div>

              <div class="auth-input-group">
                <span class="auth-input-icon">${ic('tag')}</span>
                <input type="text" id="auth-initials" class="auth-input" value="${state.initialsVal}" placeholder="Company Initials (e.g. APX)" maxlength="4" autocomplete="off">
              </div>

              <div class="auth-input-group">
                <span class="auth-input-icon">${ic('user')}</span>
                <input type="text" id="auth-user" class="auth-input" value="${state.userVal}" placeholder="Director Username" autocomplete="off">
              </div>

              <div class="auth-input-group">
                <span class="auth-input-icon">${ic('bolt')}</span>
                <input type="password" id="auth-pass" class="auth-input" value="${state.passVal}" placeholder="Director Passcode" autocomplete="off">
              </div>

              <button class="btn gold" data-act="authWizardNext">
                Next: Select Territory &rarr;
              </button>
            ` : state.signupStep === 2 ? `
              <div style="margin-bottom:12px;">
                <label style="font-size:11px; color:var(--mu); font-weight:700; display:block; margin-bottom:4px;">Starting Region</label>
                <select id="auth-region" class="auth-input" style="background:var(--bg); color:var(--tx); cursor:pointer;" data-act="changeRegion">
                  <option value="Africa" ${state.selectedRegion === 'Africa' ? 'selected' : ''}>Africa (ECOWAS & Sahel)</option>
                  <option value="Europe" ${state.selectedRegion === 'Europe' ? 'selected' : ''}>Europe (Schengen & Atlantic)</option>
                  <option value="America" ${state.selectedRegion === 'America' ? 'selected' : ''}>North America (Interstate)</option>
                  <option value="Asia" ${state.selectedRegion === 'Asia' ? 'selected' : ''}>Asia (Pacific & Silk Road)</option>
                </select>
              </div>

              <div style="margin-bottom:16px;">
                <label style="font-size:11px; color:var(--mu); font-weight:700; display:block; margin-bottom:4px;">Initial Headquarters / Free Hub</label>
                <select id="auth-hub" class="auth-input" style="background:var(--bg); color:var(--tx); cursor:pointer;">
                  ${filteredHubs.map(h => `
                    <option value="${h.id}" ${currentHub?.id === h.id ? 'selected' : ''}>${h.name} (${h.city}) - Free HQ</option>
                  `).join('')}
                </select>
                <div style="font-size:10px; color:var(--mu); margin-top:6px; line-height:1.4;">
                  ${currentHub ? currentHub.desc : 'Select your starting regional logistics base.'}
                </div>
              </div>

              <div style="display:flex; gap:8px;">
                <button class="btn alt" style="flex:1;" data-act="authWizardBack">
                  &larr; Back
                </button>
                <button class="btn gold" style="flex:2;" data-act="authWizardNext">
                  Next: Review Empire &rarr;
                </button>
              </div>
            ` : `
              <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(193,154,91,0.3); border-radius:8px; padding:12px; margin-bottom:16px; font-size:11px; line-height:1.6;">
                <div style="font-weight:800; color:var(--gold); margin-bottom:6px; font-size:12px; text-transform:uppercase;">Empire Dossier Summary</div>
                <div><span style="color:var(--mu);">Company:</span> <strong style="color:var(--tx);">${state.companyVal || 'Apex Freight'}</strong> (${state.initialsVal || 'APX'})</div>
                <div><span style="color:var(--mu);">Director:</span> <strong style="color:var(--tx);">${state.userVal || 'Director'}</strong></div>
                <div><span style="color:var(--mu);">Starting Region:</span> <strong style="color:var(--tx);">${state.selectedRegion}</strong></div>
                <div><span style="color:var(--mu);">Headquarters Hub:</span> <strong style="color:var(--tx);">${currentHub ? currentHub.name + ' (' + currentHub.city + ')' : 'Hub'}</strong></div>
                <div><span style="color:var(--mu);">Free Seed Capital:</span> <strong style="color:var(--gr);">$165,000</strong> + Scania S730 Truck</div>
              </div>

              <div style="display:flex; gap:8px;">
                <button class="btn alt" style="flex:1;" data-act="authWizardBack">
                  &larr; Back
                </button>
                <button class="btn gold ${state.loading ? 'loading' : ''}" style="flex:2;" data-act="authSubmit">
                  ${state.loading ? '<div class="spinner"></div>' : 'Establish Empire'}
                </button>
              </div>
            `}
          `}

          <button class="btn alt" style="font-size:11px; padding:10px; border-color:rgba(193,154,91,0.4); margin-top:12px;" data-act="authQuickPlay">
            Direct Access: ${S.company || 'NexHaul Logistics'}
          </button>
        </div>
      </div>

      <div class="auth-footer">
        v1.0.5 · Systems Online
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

action('authMode', (d) => {
  state.mode = d.mode as any;
  state.signupStep = 1;
  state.error = '';
  set(s => s);
});

action('authWizardNext', () => {
  state.userVal = ($('auth-user') as HTMLInputElement)?.value || state.userVal;
  state.passVal = ($('auth-pass') as HTMLInputElement)?.value || state.passVal;
  state.companyVal = ($('auth-company') as HTMLInputElement)?.value || state.companyVal;
  state.initialsVal = ($('auth-initials') as HTMLInputElement)?.value || state.initialsVal;

  if (state.signupStep === 1) {
    if (!state.userVal || !state.passVal || !state.companyVal) {
      state.error = 'Please fill in Company Name, Username, and Passcode';
      return set(s => s);
    }
  }

  if (state.signupStep === 2) {
    state.selectedRegion = ($('auth-region') as HTMLSelectElement)?.value || state.selectedRegion;
    state.selectedHubId = ($('auth-hub') as HTMLSelectElement)?.value || state.selectedHubId;
  }

  state.error = '';
  state.signupStep = Math.min(3, state.signupStep + 1);
  set(s => s);
});

action('authWizardBack', () => {
  state.signupStep = Math.max(1, state.signupStep - 1);
  state.error = '';
  set(s => s);
});

action('changeRegion', (d) => {
  if (d.value) {
    state.selectedRegion = d.value;
    const filtered = REGIONAL_HUBS.filter(h => h.region === state.selectedRegion);
    if (filtered.length > 0) {
      state.selectedHubId = filtered[0].id;
    }
    set(s => s);
  }
});

action('authSubmit', async () => {
  if (state.loading) return;

  if (state.mode === 'signup') {
    state.userVal = ($('auth-user') as HTMLInputElement)?.value || state.userVal;
    state.passVal = ($('auth-pass') as HTMLInputElement)?.value || state.passVal;
    state.companyVal = ($('auth-company') as HTMLInputElement)?.value || state.companyVal;
    state.initialsVal = ($('auth-initials') as HTMLInputElement)?.value || state.companyVal.substring(0, 3).toUpperCase();
    state.selectedRegion = ($('auth-region') as HTMLSelectElement)?.value || state.selectedRegion;
    state.selectedHubId = ($('auth-hub') as HTMLSelectElement)?.value || state.selectedHubId;

    if (!state.userVal || !state.passVal || !state.companyVal) {
      state.error = 'All fields are required';
      return set(s => s);
    }
  }

  const user = state.mode === 'signup' ? state.userVal : (($('auth-user') as HTMLInputElement)?.value || '');
  const pass = state.mode === 'signup' ? state.passVal : (($('auth-pass') as HTMLInputElement)?.value || '');

  if (!user || !pass) {
    state.error = 'Identification required';
    return set(s => s);
  }

  state.loading = true;
  state.error = '';
  set(s => s);

  try {
    if (state.mode === 'signup') {
      const initials = state.initialsVal || state.companyVal.substring(0, 3).toUpperCase();
      const region = state.selectedRegion || 'Africa';
      const hubId = state.selectedHubId || REGIONAL_HUBS.find(h => h.region === region)?.id || 'hub_lagos';

      await authService.register(user, pass, state.companyVal, initials, region, hubId);
      toast('Registration Successful', 'success');
      toast('Welcome, Director ' + user);
    } else {
      const success = await authService.login(user, pass);
      if (!success) throw new Error('Invalid Credentials');
      toast('Login Successful', 'success');
      toast('Welcome back, Director');
    }
    
    setTimeout(() => location.reload(), 1000);
  } catch (err: any) {
    state.loading = false;
    state.error = err.message || 'Connection failed';
    toast(state.error, 'err');
    set(s => s);
  }
});

export default { render };
