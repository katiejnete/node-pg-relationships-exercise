const ExpressError = require("../expressError");
const db = require("../db");

async function findInvoice(req, res, next) {
  try {
    const id = req.params.id;
    const result = await db.query(`SELECT * FROM invoices WHERE id = $1`, [id]);
    if (result.rows.length === 0)
      throw new ExpressError(`Cannot find invoice with id of ${id}`, 404);
    next();
  } catch (err) {
    next(err);
  }
}

function validateInvoice(req, res, next) {
  try {
    const { comp_code, amt, paid } = req.body;
    if (req.method === "POST") {
      if (!comp_code || !amt)
        throw new ExpressError(
          `Cannot create/replace because missing comp_code and/or amt data`,
          422
        );
    } else if (req.method === "PUT") {
      if (!amt)
        throw new ExpressError(
          `Cannot replace because missing amt and/or paid data`,
          304
        );
      if (paid) {
        if (typeof paid !== "boolean")
          throw new ExpressError(`Please enter paid as a boolean`, 422);
      }
    }
    if (typeof amt !== "number")
      throw new ExpressError(`Please enter amt as a number`, 422);
    else next();
  } catch (err) {
    next(err);
  }
}

module.exports = {findInvoice, validateInvoice};