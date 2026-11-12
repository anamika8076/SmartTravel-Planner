// City → IATA airport code. Mirrors AIRPORT_CODES in the backend planner
// (planner/services.py) so the flight search form can prefill codes.
export const AIRPORT_CODES = {
  delhi: 'DEL',
  'new delhi': 'DEL',
  mumbai: 'BOM',
  bengaluru: 'BLR',
  bangalore: 'BLR',
  hyderabad: 'HYD',
  chennai: 'MAA',
  kolkata: 'CCU',
  pune: 'PNQ',
  jaipur: 'JAI',
  shimla: 'SLV',
  manali: 'KUU',
  kullu: 'KUU',
  goa: 'GOI',
  kochi: 'COK',
  ahmedabad: 'AMD',
  lucknow: 'LKO',
  varanasi: 'VNS',
  indore: 'IDR',
  bhopal: 'BHO',
  amritsar: 'ATQ',
  chandigarh: 'IXC',
  srinagar: 'SXR',
  dehradun: 'DED',
  patna: 'PAT',
  guwahati: 'GAU',
  nagpur: 'NAG',
  udaipur: 'UDR',
  jodhpur: 'JDH',
};

export function airportCodeFor(place) {
  const value = String(place || '').trim();
  if (/^[a-z]{3}$/i.test(value)) return value.toUpperCase();
  return AIRPORT_CODES[value.split(',')[0].trim().toLowerCase()] || '';
}
