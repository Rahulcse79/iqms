
import iqmsConfig from './iqms/config';
import davConfig from './dav/config';

const tenants = {
  iqms: iqmsConfig,
  dav: davConfig,
};

export const getTenantConfig = (tenantId) => {
  return tenants[tenantId] || null;
};
