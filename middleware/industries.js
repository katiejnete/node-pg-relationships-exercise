const ExpressError = require("../expressError");
const db = require("../db");
const slugify = require("slugify");

async function checkDuplicateIndustry(req, res, next) {
  try {
    let { code, name } = req.body;
    code = slugify(code, {
      replacement: "",
      remove: /[.*+~?^${}()|[\]\\'"!:@]]/g,
      lower: true,
      strict: true,
      trim: true,
    });
    const codeResult = await db.query(
      `SELECT * FROM industries WHERE code = $1`,
      [code]
    );
    const nameResult = await db.query(
      `SELECT * FROM industries WHERE name = $1`,
      [name]
    );
    if (codeResult.rows.length || nameResult.rows.length)
      throw new ExpressError(
        `Cannot create because industry code and/or name already exists`,
        409
      );
    req.body.name = name;
    req.body.code = code;
    next();
  } catch (err) {
    next(err);
  }
}

async function findCheckIndustry(req,res,next) {
  try {
    const {industry_code} = req.body;
    const comp_code = req.params.code;
    const industryResult = await db.query(`SELECT * FROM industries WHERE code = $1`, [industry_code]);
    if (industryResult.rows.length === 0)
      throw new ExpressError(`Cannot find industry with code of ${industry_code}`, 404);
    const associationResult = await db.query(`SELECT * FROM companies_industries WHERE comp_code = $1 AND industry_code = $2`, [comp_code, industry_code]);
    if (associationResult.rows.length) throw new ExpressError( `Cannot create because association already exists`, 409);
    next();
  } catch (err) {
    next(err);
  }
}

function validateIndustry(req, res, next) {
  try {
    if (req.method === "POST") {
      const {industry_code} = req.body;
      if (!industry_code)
        throw new ExpressError(
          `Cannot add association because missing industry code data`,
          422
        );
    } else {
      const { name, code } = req.body;
      if (!name || !code)
        throw new ExpressError(
          `Cannot create because missing code and/or name data`,
          422
        );
      if (typeof name !== "string" || typeof code !== "string")
        throw new ExpressError(`Please enter code and/or name as text`, 422);
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  findCheckIndustry,
  checkDuplicateIndustry,
  validateIndustry
};
