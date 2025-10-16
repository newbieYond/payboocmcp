import { parse } from 'csv-parse/sync';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

const DATA_DIR = process.env.CSV_DATA_DIR || join(process.cwd(), 'data');

export interface CSVRow {
  [key: string]: string;
}

export interface OrganizedURLs {
  urls: string[];
  categorized: Record<string, string[]>;
  total: number;
}

export interface TrackingLink {
  campaign: string;
  adMaterial: string;
  content: string;
  keyword: string;
  deepLink: string;
  trackingLink: string;
}

export interface SearchResult {
  query: string;
  matches: TrackingLink[];
  total: number;
}

/**
 * Read and parse a CSV file
 */
export async function readCSVFile(filename: string): Promise<CSVRow[]> {
  const filePath = join(DATA_DIR, filename);

  try {
    const fileContent = await readFile(filePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    return records;
  } catch (error) {
    throw new Error(`Failed to read CSV file ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get list of all CSV files in the data directory
 */
export async function getCSVFiles(): Promise<string[]> {
  try {
    const files = await readdir(DATA_DIR);
    return files.filter((file) => file.endsWith('.csv'));
  } catch (error) {
    throw new Error(`Failed to read data directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract URLs from CSV data
 */
export function extractURLs(data: CSVRow[]): string[] {
  const urlPattern = /https?:\/\/[^\s]+/g;
  const urls: string[] = [];

  for (const row of data) {
    for (const value of Object.values(row)) {
      if (typeof value === 'string') {
        const matches = value.match(urlPattern);
        if (matches) {
          urls.push(...matches);
        }
      }
    }
  }

  return [...new Set(urls)];
}

/**
 * Organize URLs by category if available in CSV
 */
export function organizeURLs(data: CSVRow[]): OrganizedURLs {
  const urls = extractURLs(data);
  const categorized: Record<string, string[]> = {};

  for (const row of data) {
    const category = row.category || row.Category || row.type || row.Type || 'uncategorized';

    if (!categorized[category]) {
      categorized[category] = [];
    }

    for (const value of Object.values(row)) {
      if (typeof value === 'string') {
        const urlPattern = /https?:\/\/[^\s]+/g;
        const matches = value.match(urlPattern);
        if (matches) {
          categorized[category].push(...matches);
        }
      }
    }
  }

  Object.keys(categorized).forEach(key => {
    categorized[key] = [...new Set(categorized[key])];
  });

  return {
    urls,
    categorized,
    total: urls.length,
  };
}

/**
 * Search for tracking links in links.csv
 */
export async function searchTrackingLinks(query: string): Promise<SearchResult> {
  try {
    const data = await readCSVFile('links.csv');
    const normalizedQuery = query.toLowerCase().trim();
    const matches: TrackingLink[] = [];

    for (const row of data) {
      const campaign = row['캠페인'] || '';
      const adMaterial = row['광고 소재'] || '';
      const content = row['콘텐츠'] || '';
      const keyword = row['키워드'] || '';
      const deepLink = row['딥링크'] || '';
      const trackingLink = row['트래킹 링크'] || '';

      // Search in all fields
      const searchText = `${campaign} ${adMaterial} ${content} ${keyword} ${deepLink} ${trackingLink}`.toLowerCase();

      if (searchText.includes(normalizedQuery)) {
        matches.push({
          campaign,
          adMaterial,
          content,
          keyword,
          deepLink,
          trackingLink,
        });
      }
    }

    return {
      query,
      matches,
      total: matches.length,
    };
  } catch (error) {
    throw new Error(`Failed to search tracking links: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
