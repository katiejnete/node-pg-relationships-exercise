const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const db = require("../db");
const { findCompany, findInvoice, validateInvoice } = require("./middleware");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT id, comp_code FROM invoices`);
    return res.json({ invoices: results.rows });
  } catch (err) {
    return next(err);
  }
});

router.get("/:id", findInvoice, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, amt, paid, add_date, paid_date, code, name, description FROM invoices JOIN companies ON invoices.comp_code = companies.code WHERE id = $1`,
      [req.params.id]
    );
    const { id, amt, paid, add_date, paid_date, code, name, description } =
      result.rows[0];
    return res.json({
      invoice: {
        id,
        amt,
        paid,
        add_date,
        paid_date,
        company: { code, name, description },
      },
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/", findCompany, validateInvoice, async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    const result = await db.query(
      "INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *",
      [comp_code, amt]
    );
    return res.status(201).json({ invoice: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.put("/:id", findInvoice, validateInvoice, async (req, res, next) => {
  try {
    const { amt, paid } = req.body;
    let paid_date;
    let result;
    paid_date = paid ? new Date().toDateString() : null;
    if (paid === undefined) {
      result = await db.query(
        `UPDATE invoices SET amt = $1 WHERE id = $2 RETURNING *`,
        [amt, req.params.id]
      );
    } else {
      result = await db.query(
        `UPDATE invoices SET amt = $1, paid = $2, paid_date = $3 WHERE id = $4 RETURNING *`,
        [amt, paid, paid_date, req.params.id]
      );
    }
    return res.status(201).json({ invoice: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.delete("/:id", findInvoice, async (req, res, next) => {
  try {
    await db.query(`DELETE FROM invoices WHERE id = $1`, [req.params.id]);
    return res.status(202).json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
