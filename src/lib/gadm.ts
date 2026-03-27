/**
 * Fetch GADM administrative boundaries for the area covering the given points.
 * Tries from the finest level down to level 1, returning the first that succeeds.
 */

const GADM_BASE = "https://geodata.ucdavis.edu/gadm/gadm4.1/json";

/** Reverse-geocode a point to get ISO-3166-1 alpha-3 country code */
async function getCountryISO3(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=3`,
      { headers: { "User-Agent": "Geonomia/1.0" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const cc2 = data.address?.country_code?.toUpperCase();
    if (!cc2) return null;
    // Convert ISO2 → ISO3 using a lookup
    return iso2to3(cc2);
  } catch {
    return null;
  }
}

/** Try to fetch GADM GeoJSON at a given level for a country */
async function fetchGADMLevel(iso3: string, level: number): Promise<any | null> {
  try {
    const url = `${GADM_BASE}/gadm41_${iso3}_${level}.json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export interface GADMResult {
  geojson: any;
  level: number;
  country: string;
}

/**
 * Load the finest GADM level available for the country containing the given points.
 * maxLevel caps how deep we try (GADM goes up to ~5 for some countries).
 */
export async function loadFinestGADM(
  points: [number, number][], // [lat, lng]
  maxLevel = 4
): Promise<GADMResult | null> {
  if (points.length === 0) return null;

  // Use centroid of points for country lookup
  const avgLat = points.reduce((s, p) => s + p[0], 0) / points.length;
  const avgLng = points.reduce((s, p) => s + p[1], 0) / points.length;

  const iso3 = await getCountryISO3(avgLat, avgLng);
  if (!iso3) return null;

  // Try from finest level down
  for (let level = maxLevel; level >= 1; level--) {
    const geojson = await fetchGADMLevel(iso3, level);
    if (geojson && geojson.features?.length > 0) {
      return { geojson, level, country: iso3 };
    }
  }

  return null;
}

/** Minimal ISO 3166-1 alpha-2 → alpha-3 lookup */
function iso2to3(cc2: string): string | null {
  const map: Record<string, string> = {
    AF:"AFG",AL:"ALB",DZ:"DZA",AS:"ASM",AD:"AND",AO:"AGO",AG:"ATG",AR:"ARG",AM:"ARM",AU:"AUS",
    AT:"AUT",AZ:"AZE",BS:"BHS",BH:"BHR",BD:"BGD",BB:"BRB",BY:"BLR",BE:"BEL",BZ:"BLZ",BJ:"BEN",
    BT:"BTN",BO:"BOL",BA:"BIH",BW:"BWA",BR:"BRA",BN:"BRN",BG:"BGR",BF:"BFA",BI:"BDI",CV:"CPV",
    KH:"KHM",CM:"CMR",CA:"CAN",CF:"CAF",TD:"TCD",CL:"CHL",CN:"CHN",CO:"COL",KM:"COM",CG:"COG",
    CD:"COD",CR:"CRI",CI:"CIV",HR:"HRV",CU:"CUB",CY:"CYP",CZ:"CZE",DK:"DNK",DJ:"DJI",DM:"DMA",
    DO:"DOM",EC:"ECU",EG:"EGY",SV:"SLV",GQ:"GNQ",ER:"ERI",EE:"EST",SZ:"SWZ",ET:"ETH",FJ:"FJI",
    FI:"FIN",FR:"FRA",GA:"GAB",GM:"GMB",GE:"GEO",DE:"DEU",GH:"GHA",GR:"GRC",GD:"GRD",GT:"GTM",
    GN:"GIN",GW:"GNB",GY:"GUY",HT:"HTI",HN:"HND",HU:"HUN",IS:"ISL",IN:"IND",ID:"IDN",IR:"IRN",
    IQ:"IRQ",IE:"IRL",IL:"ISR",IT:"ITA",JM:"JAM",JP:"JPN",JO:"JOR",KZ:"KAZ",KE:"KEN",KI:"KIR",
    KP:"PRK",KR:"KOR",KW:"KWT",KG:"KGZ",LA:"LAO",LV:"LVA",LB:"LBN",LS:"LSO",LR:"LBR",LY:"LBY",
    LI:"LIE",LT:"LTU",LU:"LUX",MG:"MDG",MW:"MWI",MY:"MYS",MV:"MDV",ML:"MLI",MT:"MLT",MH:"MHL",
    MR:"MRT",MU:"MUS",MX:"MEX",FM:"FSM",MD:"MDA",MC:"MCO",MN:"MNG",ME:"MNE",MA:"MAR",MZ:"MOZ",
    MM:"MMR",NA:"NAM",NR:"NRU",NP:"NPL",NL:"NLD",NZ:"NZL",NI:"NIC",NE:"NER",NG:"NGA",NO:"NOR",
    OM:"OMN",PK:"PAK",PW:"PLW",PA:"PAN",PG:"PNG",PY:"PRY",PE:"PER",PH:"PHL",PL:"POL",PT:"PRT",
    QA:"QAT",RO:"ROU",RU:"RUS",RW:"RWA",KN:"KNA",LC:"LCA",VC:"VCT",WS:"WSM",SM:"SMR",ST:"STP",
    SA:"SAU",SN:"SEN",RS:"SRB",SC:"SYC",SL:"SLE",SG:"SGP",SK:"SVK",SI:"SVN",SB:"SLB",SO:"SOM",
    ZA:"ZAF",SS:"SSD",ES:"ESP",LK:"LKA",SD:"SDN",SR:"SUR",SE:"SWE",CH:"CHE",SY:"SYR",TW:"TWN",
    TJ:"TJK",TZ:"TZA",TH:"THA",TL:"TLS",TG:"TGO",TO:"TON",TT:"TTO",TN:"TUN",TR:"TUR",TM:"TKM",
    TV:"TUV",UG:"UGA",UA:"UKR",AE:"ARE",GB:"GBR",US:"USA",UY:"URY",UZ:"UZB",VU:"VUT",VE:"VEN",
    VN:"VNM",YE:"YEM",ZM:"ZMB",ZW:"ZWE",PS:"PSE",XK:"XKO",
  };
  return map[cc2] || null;
}
