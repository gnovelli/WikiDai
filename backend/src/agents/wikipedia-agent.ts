import axios from 'axios';
import { WikipediaSummary } from '../types';

const WIKIPEDIA_API = 'https://en.wikipedia.org/api/rest_v1';

/**
 * Wikipedia Agent
 * Retrieves article summaries from Wikipedia
 */
export class WikipediaAgent {
  async execute(term: string): Promise<WikipediaSummary> {
    console.log(`📚 [Wikipedia] Fetching summary for: "${term}"`);

    try {
      // Normalize term for URL (spaces to underscores)
      const normalizedTerm = term.trim().replace(/\s+/g, '_');

      const response = await axios.get<WikipediaSummary>(
        `${WIKIPEDIA_API}/page/summary/${encodeURIComponent(normalizedTerm)}`,
        {
          headers: {
            'User-Agent': 'WikidAI-PoC/0.1 (Educational Project)',
          },
          timeout: 8000,
        }
      );

      console.log(`✅ [Wikipedia] Summary retrieved: "${response.data.title}"`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn(`⚠️  [Wikipedia] Article not found: "${term}"`);
        throw new Error(`Wikipedia article not found for: "${term}"`);
      }

      console.error('❌ [Wikipedia] Request failed:', error.message);
      throw new Error(`Wikipedia request failed: ${error.message}`);
    }
  }

  /**
   * Format Wikipedia summary for output
   */
  formatSummary(summary: WikipediaSummary): string {
    let output = `**${summary.title}**\n\n`;
    output += summary.extract;

    if (summary.content_urls?.desktop?.page) {
      output += `\n\n🔗 Read more: ${summary.content_urls.desktop.page}`;
    }

    return output;
  }
}
