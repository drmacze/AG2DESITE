window.AG2_RUNTIME_CONFIG = window.AG2_RUNTIME_CONFIG || {
  backend: { enabled: false, provider: 'none', url: '', publishableKey: '' },
  accessHash: ''
};
if (window.AG2_RUNTIME_CONFIG.accessHash) window.AG2_DEV_ACCESS_HASH = window.AG2_RUNTIME_CONFIG.accessHash;
