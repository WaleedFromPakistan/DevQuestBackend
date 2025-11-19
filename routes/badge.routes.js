const express = require("express");
const router = express.Router();

const {
  createBadge,
  getBadges,
  getBadgeById,
  updateBadge,
  deleteBadge,
} = require("../controllers/badge.controller");

router.post("/", createBadge);
router.get("/", getBadges);
router.get("/:id", getBadgeById);
router.put("/:id", updateBadge);
router.delete("/:id", deleteBadge);

module.exports = router;
