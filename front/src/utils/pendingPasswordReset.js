// The reset password link of a Gladys Plus user who also asked to reset their two-factor
// authentication from it (docs/specs/gladys-plus-recovery-codes-from-instance.md, E.2): kept in
// this browser so the landing page of the two-factor reset email leads back to it. It is never
// put in the emailed link: a leaked link alone would then be enough to take the account.
const KEY = 'gladys_plus_pending_password_reset';
// a reset password link is valid two hours after its email: never kept longer than that
const MAX_AGE_IN_MS = 2 * 60 * 60 * 1000;

// Storage can be unavailable (private browsing, blocked site data): the flow then only loses
// the shortcut, the email says how to go back to the reset password page.
export const savePendingPasswordReset = token => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ token, savedAt: Date.now() }));
  } catch (e) {
    // no shortcut
  }
};

export const clearPendingPasswordReset = () => {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    // nothing to clear
  }
};

export const getPendingPasswordReset = () => {
  try {
    const pending = JSON.parse(localStorage.getItem(KEY));
    if (pending && typeof pending.token === 'string' && Date.now() - pending.savedAt < MAX_AGE_IN_MS) {
      return pending.token;
    }
  } catch (e) {
    return null;
  }
  clearPendingPasswordReset();
  return null;
};
