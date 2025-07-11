const express = require("express");
const { login, register } = require("../controllers/auth.controller");
const { validateRegisterUser, validateLoginUser } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/login", validateLoginUser, login);
router.post("/register", validateRegisterUser, register);

module.exports = router;
