process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoice;

beforeEach(async () => {
  await db.query(
    `DELETE FROM companies;
    INSERT INTO companies (code, name) VALUES ('es','EduSkin') RETURNING code, name;
    INSERT INTO invoices (comp_Code, amt, paid, paid_date)
    VALUES ('es', 100, false, null)`
  );
  const companyResult = await db.query(`SELECT * FROM companies`);
  const invoiceResult = await db.query(
    `SELECT add_date, amt, id, paid, paid_date FROM invoices`
  );
  testCompany = companyResult.rows[0];
  testInvoice = invoiceResult.rows[0];
  testInvoice.company = testCompany;
});

afterEach(async () => {
  await db.query("DELETE FROM companies");
  await db.query("DELETE FROM invoices");
});

afterAll(async () => {
  await db.end();
});

describe("GET /invoices", () => {
  test("Get list of 1 invoice", async () => {
    const { id } = testInvoice;
    const comp_code = testCompany.code;
    testInvoice = { id, comp_code };
    const response = await request(app).get(`/invoices`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ invoices: [testInvoice] });
  });
});

describe("GET /invoices/:id", () => {
  test("Get specific invoice", async () => {
    const response = await request(app).get(`/invoices/${testInvoice.id}`);
    testInvoice.add_date = response.body.invoice.add_date;
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ invoice: testInvoice });
  });
  test("Get non-existent invoice", async () => {
    const response = await request(app).get(`/invoices/0`);
    expect(response.statusCode).toBe(404);
  });
});

describe("POST /invoices", () => {
  test("Create invoice", async () => {
    const newInvoice = { comp_code: "es", amt: 3 };
    const response = await request(app).post(`/invoices`).send(newInvoice);
    const invoiceResult = await db.query(
      `SELECT add_date, amt, id, paid, paid_date, comp_code FROM invoices WHERE amt = 3`
    );
    invoiceResult.rows[0].add_date = response.body.invoice.add_date;
    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({ invoice: invoiceResult.rows[0] });
  });
  test("Create invoice with invalid data", async () => {
    const newInvoice = { comp_code: "es", amt: "lafj" };
    const response = await request(app).post(`/invoices`).send(newInvoice);
    expect(response.statusCode).toBe(422);
  });
});

describe("PUT /invoices/:id", () => {
  test("Replace specific invoice", async () => {
    const replaceData = { amt: 300 };
    const response = await request(app)
      .put(`/invoices/${testInvoice.id}`)
      .send(replaceData);
    const invoiceResult = await db.query(
      `SELECT add_date, amt, id, paid, paid_date, comp_code FROM invoices WHERE amt = 300`
    );
    invoiceResult.rows[0].add_date = response.body.invoice.add_date;
    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({ invoice: invoiceResult.rows[0] });
  });
  test("Replace non-existent invoice", async () => {
    const response = await request(app).put(`/invoices/0`);
    expect(response.statusCode).toBe(404);
  });
});

describe("DELETE /invoices/:id", () => {
  test("Delete specific invoice", async () => {
    const response = await request(app).delete(
      `/invoices/${testInvoice.id}`
    );
    expect(response.statusCode).toBe(202);
  });
  test("Delete non-existent invoice", async () => {
    const response = await request(app).delete(`/invoices/0`);
    expect(response.statusCode).toBe(404);
  });
});
