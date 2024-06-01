/** BizTime express application. */

const express = require("express");
const companyRoutes = require("./routes/companies");
const invoiceRoutes = require("./routes/invoices");
const app = express();
const ExpressError = require("./expressError");

app.use(express.json());
app.get("/favicon.ico", (req,res) => res.sendStatus(204));
app.use("/companies", companyRoutes)
app.use("/invoices", invoiceRoutes)


/** 404 handler */

app.use(function(req, res, next) {
  const err = new ExpressError("Not Found", 404);
  return next(err);
});

/** general error handler */

app.use((err, req, res, next) => {
  if (err.message.includes("is not defined")) {
    err.status = 400;
    err.message = "Please follow endpoint JSON data format";
  }
  res.status(err.status || 500);

  return res.json({
    error: err,
    message: err.message
  });
});


module.exports = app;
