// Tenant context enforcement middleware
function requireTenantMatch(getTenantIdFromReq) {
  return (req, res, next) => {
    const userTenantId = req.user.tenantId;
    const resourceTenantId = getTenantIdFromReq(req);
    if (!userTenantId || !resourceTenantId || userTenantId.toString() !== resourceTenantId.toString()) {
      return res.status(403).json({ error: 'Forbidden: cross-tenant access denied' });
    }
    next();
  };
}

module.exports = { requireTenantMatch }; 