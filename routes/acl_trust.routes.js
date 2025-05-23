//backend/routes/acl.routes.js
const express = require("express");
const router = express.Router();
const aclTructController = require("../controllers/acl_trust.controller");
const { verifyToken } = require("../middleware/auth.middleware");

router.get("/acl-trusts", aclTructController.getAclTrust);

module.exports = router;