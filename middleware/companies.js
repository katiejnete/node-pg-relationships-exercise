const ExpressError = require("../expressError");
const db = require("../db");
const slugify = require("slugify");

async function findCompany(req, res, next) {
  try {
    const code = req.params.code || req.body.comp_code;
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

async function checkDuplicateCompany(req, res, next) {
  try {
    let { name } = req.body;
    let code = name.replace("$", "");
    if (name.includes(" ")) {
      code = code.slice(0, name.indexOf(" "));
    }
    code = slugify(code, {
      replacement: "",
      remove: /[.*+~?^${}()|[\]\\'"!:@]]/g,
      lower: true,
      strict: true,
      trim: true,
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
    req.body.name = name;
    req.body.code = code;
    next();
  } catch (err) {
    next(err);
  }
}

function validateCompany(req, res, next) {
  try {
    const { name, description } = req.body;
    if (req.method === "POST") {
      if (!name)
        throw new ExpressError(
          `Cannot create/replace because missing code and/or name data`,
          422
        );
      if (description) {
        if (typeof description !== "string" || typeof name !== "string")
          throw new ExpressError(
            `Please enter name and/or description as text`,
            422
          );
      }
    } else if (req.method === "PUT") {
      if (!name)
        throw new ExpressError(`Cannot replace because missing name data`, 304);
    }
    if (typeof name !== "string")
      throw new ExpressError(`Please enter code and/or name as text`, 422);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { findCompany, checkDuplicateCompany, validateCompany };
