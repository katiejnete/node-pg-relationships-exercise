const ExpressError = require("../expressError");
const db = require("../db");
const slugify = require("slugify")

async function findCompany(req, res, next) {
  try {
    const code = req.method !== "POST" ? req.params.code : req.body.comp_code;
    const result = await db.query(`SELECT * FROM companies WHERE code = $1`, [
      code,
    ]);
    if (result.rows.length === 0)
      throw new ExpressError(`Cannot find company with code of ${code}`, 404);
    next();
  } catch (err) {
    next(err);
  }
}

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

async function checkDuplicateCompany(req, res, next) {
  try {
    let { name } = req.body;
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
    const codeResult = await db.query(
      `SELECT * FROM companies WHERE code = $1`,
      [code]
    );
    const nameResult = await db.query(
      `SELECT * FROM companies WHERE name = $1`,
      [name]
    );
    if (codeResult.rows.length || nameResult.rows.length)
      throw new ExpressError(
        `Cannot create because company code and/or name already exists`,
        409
      );
    next();
  } catch (err) {
    next(err);
  }
}

function validateCompany(req, res, next) {
  try {
    const { name, description } = req.body;
    if (req.method === "POST") {
      if (!name) throw new ExpressError(`Cannot create/replace because missing code and/or name data`,422);
      if (typeof description !== 'string' || typeof name !== 'string') throw new ExpressError(`Please enter name and/or description as text`, 422);
    }
    else if (req.method === "PUT") {
      if (!name) throw new ExpressError(`Cannot replace because missing name data`, 304);
      if (typeof name !== 'string') throw new ExpressError(`Please enter code and/or name as text`, 422);
    } 
    next();
  } catch (err) {
    next(err);
  }
}

function validateInvoice(req, res, next) {
  try {
    const { comp_code, amt, paid } = req.body;
    if (req.method === "POST") {
      if (!comp_code || !amt) throw new ExpressError(`Cannot create/replace because missing comp_code and/or amt data`,422);
    }
    else if (req.method === "PUT") {
      if (!amt) throw new ExpressError(`Cannot replace because missing amt and/or paid data`, 304);
      if (paid) {
        if (typeof paid !== 'boolean') throw new ExpressError(`Please enter paid as a boolean`, 422);
      }
    } 
    if (typeof amt !== 'number') throw new ExpressError(`Please enter amt as a number`, 422);
    else next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  findCompany,
  findInvoice,
  checkDuplicateCompany,
  validateCompany,
  validateInvoice,
};
