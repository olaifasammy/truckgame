export interface WelcomeTemplateData {
  companyName: string;
  hqCity: string;
  startingCapital: number;
}

export function getWelcomeMessage(data: WelcomeTemplateData) {
  const title = "EMPIRE ESTABLISHED: WELCOME TO NEXHAUL";
  const body = `Executive Dispatch,\n\nWelcome to NexHaul Logistics, ${data.companyName}!\n\nYour global logistics and freight empire has been officially incorporated with headquarters established at ${data.hqCity}.\n\nInitial capitalization of $${data.startingCapital.toLocaleString()} has been credited to your corporate treasury. Your initial terminal bay, commercial license permits, and foundational fleet assets are ready for operations.\n\nReview your regional hubs, freight spot board, and available commercial contracts to initiate your first dispatch operations.\n\nBoard of Directors\nNexHaul Logistics Global`;
  const msg = `Enterprise Established: Welcome to NexHaul Logistics, ${data.companyName}! Your global logistics empire registration is complete.`;
  return { title, msg, body };
}
