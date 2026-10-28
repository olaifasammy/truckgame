import { set } from '../core/store';
import { $, toast, action } from '../core/ui';
import { ic } from '../core/icons';
import { authService } from '../domain/auth/auth.service';

const state = {
  loading: false,
  mode: 'login' as 'login' | 'signup',
  error: ''
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
              <input type="text" id="auth-company" class="auth-input" placeholder="Company Name" autocomplete="off">
            </div>
          ` : ''}

          <button class="btn gold ${state.loading ? 'loading' : ''}" data-act="authSubmit">
            ${state.loading ? '<div class="spinner"></div>' : (isSignup ? 'Establish Empire' : 'Access Terminal')}
          </button>
        </div>
      </div>

      <div class="auth-footer">
        v1.0.4 · Systems Online
      </div>
    </div>
  `;
}

action('authMode', (d) => {
  state.mode = d.mode as any;
  state.error = '';
  set(s => s); // Refresh
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
      if (!company) throw new Error('Company name required');
      await authService.register(user, pass, company);
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
