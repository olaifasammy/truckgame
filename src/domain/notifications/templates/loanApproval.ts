export interface LoanApprovalTemplateData {
  principal: number;
  lender: string;
  apr: number;
  termDays: number;
}

export function getLoanApprovalMessage(data: LoanApprovalTemplateData) {
  const title = "LOAN COMMITTEE APPROVED";
  const msg = `🏦 Loan Committee Approved: $${data.principal.toLocaleString()} facility secured from ${data.lender} at ${data.apr}% APR (${data.termDays}-day term).`;
  const body = `Official Credit Committee Ruling:\n\nYour application for a $${data.principal.toLocaleString()} commercial credit facility with ${data.lender} has been formally evaluated and APPROVED.\n\nFacility Terms:\n- Principal: $${data.principal.toLocaleString()}\n- Interest Rate: ${data.apr}% APR\n- Repayment Tenure: ${data.termDays} Days\n\nFunds have been disbursed to your corporate treasury. Ensure timely daily amortization payments to maintain high corporate credit standing.\n\nCredit Risk Management Board`;
  return { title, msg, body };
}
