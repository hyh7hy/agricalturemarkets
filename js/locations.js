// js/locations.js
// Ethiopian location hierarchy: Region -> Zone -> City/Town.
// Coordinates are approximate town-centre lat/lng (public-knowledge
// values, not survey-grade). This is a representative subset covering
// major agricultural zones, not an exhaustive gazetteer — extend the
// `LOCATIONS` tree the same way to add more zones/towns.

export const LOCATIONS = {
  "Oromia": {
    "Jimma": [
      { city: "Jimma", lat: 7.6733, lng: 36.8344 },
      { city: "Agaro", lat: 7.8500, lng: 36.5833 },
      { city: "Limu Genet", lat: 7.9667, lng: 36.8833 }
    ],
    "East Wollega": [
      { city: "Nekemte", lat: 9.0900, lng: 36.5500 },
      { city: "Shambu", lat: 9.5667, lng: 37.1000 }
    ],
    "West Shewa": [
      { city: "Ambo", lat: 8.9833, lng: 37.8500 },
      { city: "Bako", lat: 9.1167, lng: 37.0667 }
    ],
    "Arsi": [
      { city: "Asella", lat: 7.9500, lng: 39.1333 },
      { city: "Sagure", lat: 7.7333, lng: 39.1500 }
    ],
    "Bale": [
      { city: "Robe", lat: 7.1167, lng: 40.0000 },
      { city: "Goba", lat: 7.0167, lng: 39.9833 }
    ],
    "East Shewa": [
      { city: "Adama", lat: 8.5400, lng: 39.2700 },
      { city: "Bishoftu", lat: 8.7500, lng: 38.9833 }
    ]
  },
  "Amhara": {
    "North Gondar": [
      { city: "Gondar", lat: 12.6000, lng: 37.4667 },
      { city: "Debark", lat: 13.1500, lng: 37.9000 }
    ],
    "East Gojjam": [
      { city: "Debre Markos", lat: 10.3333, lng: 37.7167 }
    ],
    "South Wollo": [
      { city: "Dessie", lat: 11.1333, lng: 39.6333 },
      { city: "Kombolcha", lat: 11.0833, lng: 39.7333 }
    ],
    "West Gojjam": [
      { city: "Bahir Dar", lat: 11.5933, lng: 37.3906 },
      { city: "Finote Selam", lat: 10.7000, lng: 37.2667 }
    ]
  },
  "SNNPR": {
    "Sidama": [
      { city: "Hawassa", lat: 7.0500, lng: 38.4667 },
      { city: "Yirgalem", lat: 6.7500, lng: 38.4167 }
    ],
    "Gedeo": [
      { city: "Dilla", lat: 6.4110, lng: 38.3100 }
    ],
    "Wolayita": [
      { city: "Sodo", lat: 6.8500, lng: 37.7500 }
    ],
    "Gurage": [
      { city: "Wolkite", lat: 8.2833, lng: 37.7833 },
      { city: "Butajira", lat: 8.1167, lng: 38.3667 }
    ]
  },
  "Tigray": {
    "Mekelle": [
      { city: "Mekelle", lat: 13.4967, lng: 39.4753 }
    ],
    "South Tigray": [
      { city: "Maychew", lat: 12.7833, lng: 39.5333 }
    ]
  },
  "Somali": {
    "Jijiga": [
      { city: "Jijiga", lat: 9.3500, lng: 42.8000 }
    ]
  },
  "Addis Ababa": {
    "Addis Ababa": [
      { city: "Addis Ababa", lat: 9.0300, lng: 38.7400 }
    ]
  },
  "Dire Dawa": {
    "Dire Dawa": [
      { city: "Dire Dawa", lat: 9.5931, lng: 41.8661 }
    ]
  },
  "Benishangul-Gumuz": {
    "Assosa": [
      { city: "Assosa", lat: 10.0667, lng: 34.5333 }
    ]
  }
};

export function getRegions() {
  return Object.keys(LOCATIONS);
}
export function getZones(region) {
  return region && LOCATIONS[region] ? Object.keys(LOCATIONS[region]) : [];
}
export function getCities(region, zone) {
  return region && zone && LOCATIONS[region]?.[zone] ? LOCATIONS[region][zone] : [];
}
export function findCoords(region, zone, cityName) {
  const list = getCities(region, zone);
  const match = list.find(c => c.city === cityName);
  return match ? { lat: match.lat, lng: match.lng } : null;
}
