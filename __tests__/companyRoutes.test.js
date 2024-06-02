process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async () => {
  companyResult = await db.query(
    `INSERT INTO companies (code, name) VALUES ('edu','Edu Skin') RETURNING *`
  );
  testCompany = companyResult.rows[0];
});

afterEach(async () => {
  await db.query("DELETE FROM companies");
});

afterAll(async () => {
  await db.end();
});

describe("GET /companies", () => {
  test("Get list of 1 company", async () => {
    const { code, name } = testCompany;
    const response = await request(app).get(`/companies`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ companies: [{ code, name }] });
  });
});

describe("GET /companies/:code", () => {
  test("Get specific company", async () => {
    const code = testCompany.code;
    const invoiceResults = await db.query(
      `SELECT id, amt, paid, add_date, paid_date FROM invoices WHERE comp_code = $1`,
      [code]
    );
    const industryResults = await db.query(
      `SELECT name FROM industries as i JOIN companies_industries as ci ON i.code = ci.industry_code WHERE comp_code = $1`,
      [code]
    );
    testCompany.description = null;
    testCompany.invoices = invoiceResults.rows;
    testCompany.industries = industryResults.rows.map((r) => r.name);
    const response = await request(app).get(`/companies/${testCompany.code}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ company: testCompany });
  });
  test("Get non-existent company", async () => {
    const response = await request(app).get(`/companies/0`);
    expect(response.statusCode).toBe(404);
  });
});

describe("POST /companies", () => {
  test("Create company", async () => {
    const newCompany = { name: "miffy rules" };
    const response = await request(app).post(`/companies`).send(newCompany);
    newCompany.description = null;
    newCompany.code = "miffy";
    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({ company: newCompany });
  });
  test("Create company that already exists", async () => {
    const newCompany = testCompany;
    newCompany.description = null;
    const response = await request(app).post(`/companies`).send(newCompany);
    expect(response.statusCode).toBe(409);
  });
  test("Create company with invalid data", async () => {
    const newCompany = { code: 123, name: 123 };
    newCompany.description = null;
    const response = await request(app).post(`/companies`).send(newCompany);
    expect(response.statusCode).toBe(422);
  });
});

describe("PUT /companies/:code", () => {
  test("Replace specific company", async () => {
    const replaceData = { name: "new", description: "text" };
    replaceData.code = replaceData.name;
    const response = await request(app)
      .put(`/companies/${testCompany.code}`)
      .send(replaceData);
    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({ company: replaceData });
  });
  test("Replace non-existent company", async () => {
    const replaceData = { name: "new", description: "text" };
    const response = await request(app).put(`/companies/0`).send(replaceData);
    expect(response.statusCode).toBe(404);
  });
});

describe("DELETE /companies/:code", () => {
  test("Delete specific company", async () => {
    const response = await request(app).delete(
      `/companies/${testCompany.code}`
    );
    expect(response.statusCode).toBe(202);
  });
  test("Delete non-existent company", async () => {
    const response = await request(app).delete(`/companies/0`);
    expect(response.statusCode).toBe(404);
  });
});
