/**
 * Nominatim Geocoding Agent
 * Converts addresses/place names to geographic coordinates using OpenStreetMap Nominatim
 */

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  place_id: number;
}

export class NominatimAgent {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org';
  private readonly userAgent = 'WikidAI/1.0 (Educational PoC)';

  /**
   * Search for location and get coordinates
   */
  async geocode(query: string): Promise<NominatimResult[]> {
    const url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}&format=json&limit=5`;

    console.log(`🌍 Nominatim geocoding: "${query}"`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.statusText}`);
    }

    const results = await response.json() as NominatimResult[];
    console.log(`✅ Found ${results.length} location(s)`);

    return results;
  }

  /**
   * Format results for Gemini
   */
  formatResults(results: NominatimResult[]): string {
    if (results.length === 0) {
      return 'No locations found.';
    }

    if (results.length === 1) {
      const { lat, lon, display_name } = results[0];
      return `Location: ${display_name}\nCoordinates: lat: ${lat}, lon: ${lon}`;
    }

    // Multiple results - return all
    return results
      .map((r, i) => `${i + 1}. ${r.display_name} (lat: ${r.lat}, lon: ${r.lon})`)
      .join('\n');
  }
}
