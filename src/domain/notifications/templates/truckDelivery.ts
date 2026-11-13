export interface TruckDeliveryTemplateData {
  truckName: string;
  unitId: number;
  city: string;
}

export function getTruckDeliveryMessage(data: TruckDeliveryTemplateData) {
  const title = "EQUIPMENT IN TRANSIT / DELIVERED";
  const msg = `Unit #${data.unitId} (${data.truckName}) delivered to ${data.city} yard and ready for dispatch.`;
  const body = `Fleet Acquisition Notice:\n\nHeavy Commercial Tractor Unit #${data.unitId} (${data.truckName}) has cleared factory inspection and arrived at the ${data.city} terminal staging yard.\n\nVehicle is fully registered, road-tax compliant, and equipped for immediate commercial freight assignment.\n\nFleet Operations Division`;
  return { title, msg, body };
}
