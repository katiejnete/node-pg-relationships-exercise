const express = require("express");
const router = new express.Router();
const db = require("../db");
const {
  checkDuplicateIndustry,
  validateIndustry,
} = require("../middleware/industries");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM industries`);
    return res.json({ industries: results.rows });
  } catch (err) {
    return next(err);
  }
});

router.post(
  "/",
  validateIndustry,
  checkDuplicateIndustry,
  async (req, res, next) => {
    try {
      const { code, name } = req.body;
      const result = await db.query(
        "INSERT INTO industries (code, name) VALUES ($1, $2) RETURNING *",
        [code, name]
      );
      return res.status(201).json({ industry: result.rows[0] });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
