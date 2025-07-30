//backend/routes/acl.routes.js
const express = require("express");
const router = express.Router();
const aclTructController = require("../controllers/acl_trust.controller");
const { verifyToken } = require("../middleware/auth.middleware");

// Corrected route with leading slash
router.get("/acl-trusts", aclTructController.getAclTrust);
router.get("/acl-trusts/:id", verifyToken, aclTructController.getRoleIdName);

module.exports = router;