import { ic } from '../core/icons';

export function renderCreateCompanyModal(isLoading = false) {
  return `
    <div class="modal-backdrop" id="create-company-modal">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Create Company Account</h3>
          <button class="modal-close" data-act="close-create-modal">${isLoading ? '' : `${ic('plus')}`}</button>
        </div>
        <div class="modal-body">
          <p class="modal-desc">Set up your credentials and company name to save your progress.</p>
          
          <div class="auth-input-group" style="margin-bottom: 12px;">
            <span class="auth-input-icon">${ic('user')}</span>
            <input type="text" id="reg-username" class="auth-input" placeholder="Username" ${isLoading ? 'disabled' : ''} />
          </div>

          <div class="auth-input-group" style="margin-bottom: 12px;">
            <span class="auth-input-icon">${ic('send')}</span>
            <input type="email" id="reg-email" class="auth-input" placeholder="Email Address" ${isLoading ? 'disabled' : ''} />
          </div>

          <div class="auth-input-group" style="margin-bottom: 12px;">
            <span class="auth-input-icon">${ic('wrench')}</span>
            <input type="password" id="reg-password" class="auth-input" placeholder="Password" ${isLoading ? 'disabled' : ''} />
          </div>

          <div class="auth-input-group">
            <span class="auth-input-icon">${ic('company')}</span>
            <input type="text" id="reg-company" class="auth-input" placeholder="Company Name" value="NexHaul Logistics" ${isLoading ? 'disabled' : ''} />
          </div>

          <button class="btn-create ${isLoading ? 'loading' : ''}" data-act="submit-create-company" style="margin-top: 16px;">
            <div class="btn-create-content">
              ${isLoading ? '<div class="spinner"></div><span>LAUNCHING EMPIRE...</span>' : `${ic('truck')}<span>REGISTER & LAUNCH</span>`}
            </div>
          </button>
        </div>
      </div>
    </div>
  `;
}
