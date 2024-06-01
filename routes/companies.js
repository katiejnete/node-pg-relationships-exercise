const express = require("express");
const router = new express.Router();
const db = require("../db");
const {
  findCompany,
  checkDuplicateCompany,
  validateCompany,
} = require("../middleware/companies");
const {
  validateIndustry,
  findCheckIndustry,
} = require("../middleware/industries");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT code, name FROM companies`);
    return res.json({ companies: results.rows });
  } catch (err) {
    return next(err);
  }
});

router.get("/:code", findCompany, async (req, res, next) => {
  try {
    const code = req.params.code;
    const companyResult = await db.query(
      `SELECT * FROM companies WHERE code = $1`,
      [code]
    );
    const invoiceResults = await db.query(
      `SELECT id, amt, paid, add_date, paid_date FROM invoices WHERE comp_code = $1`,
      [code]
    );
    const industryResults = await db.query(
      `SELECT name FROM industries as i JOIN companies_industries as ci ON i.code = ci.industry_code WHERE comp_code = $1`,
      [code]
    );
    Promise.all([companyResult, invoiceResults, industryResults]).then(() => {
      const company = companyResult.rows[0];
      company.invoices = invoiceResults.rows;
      company.industries = industryResults.rows.map((r) => r.name);
      return res.json({ company });
    });
  } catch (err) {
    return next(err);
  }
});

router.post(
  "/",
  validateCompany,
  checkDuplicateCompany,
  async (req, res, next) => {
    try {
      const { code, name, description } = req.body;
      const result = await db.query(
        "INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *",
        [code, name, description]
      );
      return res.status(201).json({ company: result.rows[0] });
    } catch (err) {
      return next(err);
    }
  }
);

router.put("/:code", validateCompany, findCompany, async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const result = await db.query(
      `UPDATE companies SET name = $1, description = $2 WHERE code = $3 RETURNING *`,
      [name, description, req.params.code]
    );
    return res.status(201).json({ company: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.delete("/:code", findCompany, async (req, res, next) => {
  try {
    await db.query(`DELETE FROM companies WHERE code = $1 RETURNING *`, [
      req.params.code,
    ]);
    return res.status(202).json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});

// Associate an industry to a company.
router.post(
  "/:code/industries",
  findCompany,
  validateIndustry,
  findCheckIndustry,
  async (req, res, next) => {
    try {
      const { industry_code } = req.body;
      const comp_code = req.params.code;
      await db.query(
        "INSERT INTO companies_industries (comp_code, industry_code) VALUES ($1, $2)",
        [comp_code, industry_code]
      );
      const companyResult = await db.query(
        `SELECT * FROM companies WHERE code = $1`,
        [comp_code]
      );
      const invoiceResults = await db.query(
        `SELECT id, amt, paid, add_date, paid_date FROM invoices WHERE comp_code = $1`,
        [comp_code]
      );
      const industryResults = await db.query(
        `SELECT name FROM industries as i JOIN companies_industries as ci ON i.code = ci.industry_code WHERE comp_code = $1`,
        [comp_code]
      );
      Promise.all([companyResult, invoiceResults, industryResults]).then(() => {
        const company = companyResult.rows[0];
        company.invoices = invoiceResults.rows;
        company.industries = industryResults.rows.map((r) => r.name);
        return res.json({ company });
      });
      return res.json({ company });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
