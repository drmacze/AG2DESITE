window.AG2_RUNTIME_CONFIG = window.AG2_RUNTIME_CONFIG || {
  backend: {
    enabled: true,
    provider: 'supabase',
    url: 'https://ydaeukhqwishlrjyfktk.supabase.co',
    publishableKey: 'sb_publishable_XNXU6SVeM-D477Ymy1ORsw_4hCHOll9',
    ingestFunction: 'debug-ingest'
  },
  accessHash: ''
};
if (window.AG2_RUNTIME_CONFIG.accessHash) window.AG2_DEV_ACCESS_HASH = window.AG2_RUNTIME_CONFIG.accessHash;
