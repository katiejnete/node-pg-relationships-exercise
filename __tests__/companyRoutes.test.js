process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async () => {
  companyResult = await db.query(
    `INSERT INTO companies (code, name) VALUES ('es','EduSkin') RETURNING code, name`
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
    const response = await request(app).get(`/companies`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ companies: [testCompany] });
  });
});

describe("GET /companies/:code", () => {
  test("Get specific company", async () => {
    testCompany.invoices = [];
    testCompany.description = null;
    const response = await request(app).get(`/companies/${testCompany.code}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ company: testCompany });
  });
  test("Get non-existent company", async () => {
    const response = await request(app).get(`/companies/0`);
    expect(response.statusCode).toBe(404);
  });
  test("Get specific company with invoice", async () => {
    await db.query(`INSERT INTO invoices (comp_Code, amt, paid, paid_date)
    VALUES ('es', 100, false, null)`);
    const response = await request(app).get(`/companies/${testCompany.code}`);    const testInvoice = await db.query(
      `SELECT add_date,amt, id, paid, paid_date FROM invoices WHERE comp_code = 'es'`
    );
    testCompany.invoices = testInvoice.rows;
    testCompany.invoices[0].add_date = response.body.company.invoices[0].add_date
    testCompany.description = null;
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ company: testCompany });
  });
});

describe("POST /companies", () => {
  test("Create company", async () => {
    const newCompany = { code: "mf", name: "miffy" };
    newCompany.description = null;
    const response = await request(app).post(`/companies`).send(newCompany);
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
    const replaceData = { name: "newName", description: "text" };
    replaceData.code = testCompany.code;
    const response = await request(app)
      .put(`/companies/${testCompany.code}`)
      .send(replaceData);
    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({ company: replaceData });
  });
  test("Replace non-existent company", async () => {
    const response = await request(app).put(`/companies/0`);
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
