import React from "react";

function currencyFormat(num: any) {
  return parseFloat(num)
    .toFixed(2)
    .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

function formateCurr(p: any) {
  return p.value >= 0 ? (
    <>{p.value === null ? "NA" : "$" + p.value}</>
  ) : (
    <>
      <span className="text-danger">{"(" + "$" + p.value.slice(1) + ")"}</span>
    </>
  );
}

function formateDataCurr(p: any) {
  return p.value >= 0 ? (
    <>{p.value === null ? "NA" : "$" + currencyFormat(p.value)}</>
  ) : (
    <>
      <span className="text-danger">
        {"(" + "$" + currencyFormat(p.value).slice(1) + ")"}
      </span>
    </>
  );
}

function formateDatabuyCurr(p: any) {
  return p.value >= 0 ? (
    <>
      {p.value === null ? (
        "NA"
      ) : (
        <span className="text-success ">{"$" + currencyFormat(p.value)}</span>
      )}
    </>
  ) : (
    <>
      <span className="text-danger">
        {"(" + "$" + currencyFormat(p.value).slice(1) + ")"}
      </span>
    </>
  );
}

function formateAsPercent(num: any) {
  return new Intl.NumberFormat("default", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num / 100);
}

function formateDataPrec(p: any) {
  return p.value >= 0 ? (
    <>{p.value === null ? "NA" : formateAsPercent(p.value)}</>
  ) : (
    <>
      <span className="text-danger">
        {"(" + formateAsPercent(p.value).slice(1) + ")"}
      </span>
    </>
  );
}

function formatLargeCurr(p: any) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return p.value >= 0 ? (
    <>{p.value === null ? "NA" : formatCurrency(p.value)}</>
  ) : (
    <>
      <span className="text-danger">
        {"(" + formatCurrency(Math.abs(p.value)) + ")"}
      </span>
    </>
  );
}

export {
  formateDataCurr,
  currencyFormat,
  formateDatabuyCurr,
  formateAsPercent,
  formateDataPrec,
  formateCurr,
  formatLargeCurr,
};
