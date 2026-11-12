import { NotificationType } from '../../systems/notify';

/**
 * Vehicle Purchase & Delivery Templates
 */
export function vehiclePurchaseTemplate(unitId: number | string, modelName: string, price: number, destination: string, transitTimeMins: number = 15) {
  return {
    title: 'EQUIPMENT PURCHASE CONFIRMED',
    msg: `Acquired ${modelName} (Unit #${unitId}) for $${price.toLocaleString()}. In transit to ${destination} Depot (Est. ${transitTimeMins} mins).`,
    body: `Invoice & Delivery Specification:\n---\nAsset: ${modelName}\nUnit ID: #${unitId}\nPurchase Price: $${price.toLocaleString()}\nRegistration: Commercial Heavy Duty\nDelivery Destination: ${destination} Depot\nTransit Status: Factory-to-Depot Transport En Route\nEstimated Delivery Time: ~${transitTimeMins} Minutes\n\nTrack progress anytime in the Garage tab under ${destination} Depot. Thank you for choosing NexHaul Fleet Solutions.`,
    type: 'ops' as NotificationType,
    priority: 1 as 0 | 1 | 2
  };
}

export function vehicleDeliveryTemplate(unitId: number | string, modelName: string, location: string) {
  return {
    title: 'EQUIPMENT ARRIVED',
    msg: `Unit #${unitId} (${modelName}) has arrived at ${location}.`,
    body: `Logistics Update:\n---\nUnit #${unitId} has successfully completed its delivery transit.\nThe vehicle is now stationed at ${location} and is available for immediate dispatch.\n\nCondition: 100% (New)\nFuel: 100%`,
    type: 'ops' as NotificationType,
    priority: 1 as 0 | 1 | 2
  };
}

/**
 * Sales & Tender Notifications
 */
export function tenderWonTemplate(client: string, cargo: string, payout: number, loads: number) {
  return {
    title: 'CORPORATE TENDER SECURED',
    msg: `Contract won: ${client} - ${cargo} (${loads} loads).`,
    body: `Contract Award Notice:\n---\nClient: ${client}\nCommodity: ${cargo}\nVolume: ${loads} Consignments\nSLA Payout: $${payout.toLocaleString()} (upon completion)\n\nOur procurement team has secured this exclusive contract. Please assign compatible units to begin fulfillment.`,
    type: 'tender' as NotificationType,
    priority: 1 as 0 | 1 | 2
  };
}

export function salesLeadTemplate(client: string, origin: string, destination: string, estimatedPay: number) {
  return {
    title: 'NEW SALES OPPORTUNITY',
    msg: `High-value lead from ${client}: ${origin} → ${destination}.`,
    body: `Dispatch Memo:\n---\nProspective Client: ${client}\nRoute: ${origin} to ${destination}\nEstimated Revenue: ~$${estimatedPay.toLocaleString()}\n\nThis lead is currently available on the freight market. Competitors may secure it if not acted upon promptly.`,
    type: 'tender' as NotificationType,
    priority: 0 as 0 | 1 | 2
  };
}

/**
 * Accounting Templates
 */
export function dailyAccountingTemplate(data: {
  revenue: number;
  salaries: number;
  fuel: number;
  maintenance: number;
  insurance: number;
  loans: number;
  net: number;
}) {
  return {
    title: 'DAILY FINANCIAL STATEMENT',
    msg: `Daily Net: $${data.net.toLocaleString()} | Revenue: $${data.revenue.toLocaleString()}`,
    body: `Daily Operating Report:\n---\nREVENUE\n- Freight Operations: $${data.revenue.toLocaleString()}\n\nEXPENSES\n- Driver Payroll: -$${data.salaries.toLocaleString()}\n- Fuel Expenditures: -$${data.fuel.toLocaleString()}\n- Maintenance/Repairs: -$${data.maintenance.toLocaleString()}\n- Insurance Premiums: -$${data.insurance.toLocaleString()}\n- Debt Service: -$${data.loans.toLocaleString()}\n---\nNET OPERATING INCOME: $${data.net.toLocaleString()}`,
    type: 'finance' as NotificationType,
    priority: 1 as 0 | 1 | 2
  };
}

export function weeklyAccountingTemplate(data: {
  revenue: number;
  expenses: number;
  net: number;
  trips: number;
  km: number;
}) {
  return {
    title: 'WEEKLY PERFORMANCE AUDIT',
    msg: `Weekly Summary: Net profit $${data.net.toLocaleString()} from ${data.trips} trips.`,
    body: `Executive Weekly Brief:\n---\nTotal Revenue: $${data.revenue.toLocaleString()}\nTotal Operating Costs: -$${data.expenses.toLocaleString()}\nNet Profit/Loss: $${data.net.toLocaleString()}\n\nOPERATIONAL STATS\n- Consignments Completed: ${data.trips}\n- Total Distance: ${data.km.toLocaleString()} km\n- Fleet Efficiency: ${((data.revenue / data.expenses) * 100).toFixed(1)}%\n\nPerformance is within expected commercial parameters.`,
    type: 'finance' as NotificationType,
    priority: 1 as 0 | 1 | 2
  };
}

export function monthlyAccountingTemplate(data: {
  revenue: number;
  expenses: number;
  net: number;
  assetsValue: number;
  liabilities: number;
  equity: number;
}) {
  return {
    title: 'MONTHLY ENTERPRISE REPORT',
    msg: `Monthly P&L: Net $${data.net.toLocaleString()} | Equity: $${data.equity.toLocaleString()}`,
    body: `Corporate Profit & Loss Statement (Monthly):\n---\nGross Revenue: $${data.revenue.toLocaleString()}\nOperating Expenses: -$${data.expenses.toLocaleString()}\nNET EARNINGS: $${data.net.toLocaleString()}\n\nBALANCE SHEET\n- Total Assets (Fleet/Property): $${data.assetsValue.toLocaleString()}\n- Outstanding Liabilities: $${data.liabilities.toLocaleString()}\n- SHAREHOLDER EQUITY: $${data.equity.toLocaleString()}\n\nNote: This report represents the consolidated financial position of the enterprise.`,
    type: 'finance' as NotificationType,
    priority: 2 as 0 | 1 | 2
  };
}
