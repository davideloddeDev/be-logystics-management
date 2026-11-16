/**
 * Middleware per la verifica dei ruoli utente (RBAC).
 * @param  {...string} allowedRoles - Ruoli ammessi ('owner', 'employee', 'admin', ecc.)
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Non autenticato'
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Accesso non autorizzato: operazione riservata ai ruoli [${allowedRoles.join(', ')}]`
      });
    }

    next;
    next();
  };
}

module.exports = authorize;
