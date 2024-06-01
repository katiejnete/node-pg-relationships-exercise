const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const db = require("../db");
const {findCompany, checkDuplicateCompany, validateCompany } = require("./middleware");
const slugify = require("slugify");

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
    const companyResult = await db.query(
      `SELECT code, name, description FROM companies WHERE code = $1`,
      [req.params.code]
    );
    const invoiceResults = await db.query(`SELECT id, amt, paid, add_date, paid_date FROM invoices WHERE comp_code = $1`,[req.params.code]);
    const company = companyResult.rows[0];
    company.invoices = invoiceResults.rows;
    return res.json({company});
  } catch (err) {
    return next(err);
  }
});

router.post("/", checkDuplicateCompany, validateCompany, async (req, res, next) => {
  try {
    let { name, description } = req.body;
    let code = name.replace("$","");
    if (name.includes(" ")) {
      code = code.slice(0,name.indexOf(" "));
    }
    code = slugify(code, {
      replacement: '',
      remove: /[.*+~?^${}()|[\]\\'"!:@]]/g,
      lower: true,
      strict: true,
      trim: true
    });
    const result = await db.query(
      "INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *",
      [code, name, description]
    );
    return res.status(201).json({ company: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.put("/:code", findCompany, validateCompany, async (req, res, next) => {
  try {
    const {name, description } = req.body;
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

module.exports = router;
