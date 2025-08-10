//backend/routes/acl_trust.routes.js
const express = require("express");
const router = express.Router();
const aclTrustController = require("../controllers/acl_trust.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { aclTrustLimiter, roleLookupLimiter } = require("../middleware/rateLimit.middleware");

// Public route for getting available roles (with rate limiting)
router.get("/acl-trusts", aclTrustLimiter, aclTrustController.getAclTrust);
router.get("/acl-trusts/:id", roleLookupLimiter, verifyToken, aclTrustController.getRoleIdName);

module.exports = router;