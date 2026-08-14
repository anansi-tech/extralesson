import { describe, expect, it } from 'vitest';
import {
  classifyCorpusFilename,
  CorpusInventoryZ,
  determineEligibility,
  parseCsecHubManifest,
  parseDriveFolderHtml,
} from '@/lib/generation/corpus-inventory';
import inventoryJson from '@/design/research/question-corpus-inventory.json';

describe('corpus inventory discovery', () => {
  it('extracts the metadata-only CSECHub manifest', () => {
    const html = `
      <script>
        const BASE_URL = "https://example.com/mathematics/";
        const FILENAMES = ["CSEC_Mathematics_P1_2024_MJ.pdf", "CSEC_Mathematics_P2_2024_MJ.pdf"];
      </script>`;
    expect(parseCsecHubManifest(html)).toEqual([
      {
        id: 'csechub:CSEC_Mathematics_P1_2024_MJ.pdf',
        source: 'csechub',
        filename: 'CSEC_Mathematics_P1_2024_MJ.pdf',
        fetch_url: 'https://example.com/mathematics/CSEC_Mathematics_P1_2024_MJ.pdf',
      },
      {
        id: 'csechub:CSEC_Mathematics_P2_2024_MJ.pdf',
        source: 'csechub',
        filename: 'CSEC_Mathematics_P2_2024_MJ.pdf',
        fetch_url: 'https://example.com/mathematics/CSEC_Mathematics_P2_2024_MJ.pdf',
      },
    ]);
  });

  it('extracts file ids and names from the public Drive listing', () => {
    const html = `
      <div class="flip-entry" id="entry-file123" tabindex="0">
        <div class="flip-entry-title">June 2018 Paper 2.pdf</div>
      </div>`;
    expect(parseDriveFolderHtml(html)[0]).toMatchObject({
      id: 'csecpastpapers-drive:file123',
      source: 'csecpastpapers-drive',
      filename: 'June 2018 Paper 2.pdf',
    });
  });
});

describe('corpus inventory classification', () => {
  it('classifies official question-paper filenames', () => {
    expect(classifyCorpusFilename('CSEC_Mathematics_P2_2024_MJ.pdf')).toEqual({
      classification: 'question-paper',
      paper: 2,
      year: 2024,
      session: 'may-june',
    });
    expect(classifyCorpusFilename('Jan 2017 p1.pdf')).toEqual({
      classification: 'question-paper',
      paper: 1,
      year: 2017,
      session: 'january',
    });
  });

  it('separates non-question files and bundles', () => {
    expect(classifyCorpusFilename('June 2006 solutions.pdf').classification).toBe('solution-or-answer');
    expect(classifyCorpusFilename('CXC Multiple Choice Mock 2.pdf').classification).toBe('mock-or-sample');
    expect(classifyCorpusFilename('Common Formulas.pdf').classification).toBe('reference');
    expect(classifyCorpusFilename('2004 to 2011 Maths P1.pdf').classification).toBe('paper-bundle');
  });

  it('allows only fetched PDF question material from Papers 1 and 2', () => {
    expect(determineEligibility({
      classification: 'question-paper',
      paper: 2,
      format: 'pdf',
      fetchSucceeded: true,
    })).toEqual({ eligible: true, reasons: [] });
    expect(determineEligibility({
      classification: 'question-paper',
      paper: 3,
      format: 'pdf',
      fetchSucceeded: true,
    })).toEqual({ eligible: false, reasons: ['paper-3-out-of-scope'] });
    expect(determineEligibility({
      classification: 'solution-or-answer',
      paper: null,
      format: 'pdf',
      fetchSucceeded: true,
    }).eligible).toBe(false);
    expect(determineEligibility({
      classification: 'paper-bundle',
      paper: 1,
      format: 'pdf',
      fetchSucceeded: true,
    })).toEqual({ eligible: false, reasons: ['bundle-requires-page-level-deduplication'] });
  });
});

describe('checked-in corpus inventory', () => {
  const inventory = CorpusInventoryZ.parse(inventoryJson);

  it('is internally consistent and contains both requested sources', () => {
    expect(inventory.summary.listed_entries).toBe(inventory.entries.length);
    expect(inventory.sources.map((source) => source.id).sort()).toEqual([
      'csechub',
      'csecpastpapers-drive',
    ]);
    expect(inventory.sources.reduce((sum, source) => sum + source.discovered_entries, 0))
      .toBe(inventory.entries.length);
    const successful = inventory.entries.filter((entry) => entry.fetch.status === 'ok');
    expect(inventory.summary.fetched_entries).toBe(successful.length);
    expect(inventory.summary.failed_entries).toBe(inventory.entries.length - successful.length);
    expect(inventory.summary.unique_file_hashes).toBe(new Set(successful.map((entry) =>
      entry.fetch.status === 'ok' ? entry.fetch.sha256 : '',
    )).size);
    expect(inventory.summary.exact_duplicate_groups).toBe(new Set(inventory.entries.flatMap((entry) =>
      entry.duplicate_group ? [entry.duplicate_group] : [],
    )).size);
    expect(inventory.summary.same_exam_groups).toBe(new Set(inventory.entries.flatMap((entry) =>
      entry.same_exam_group ? [entry.same_exam_group] : [],
    )).size);
    expect(inventory.summary.eligible_entries)
      .toBe(inventory.entries.filter((entry) => entry.eligible_for_pattern_analysis).length);
  });

  it('retains metadata only and marks no exact duplicate as eligible', () => {
    const forbiddenKeys = new Set([
      'stem',
      'options',
      'answer_key',
      'worked_solution',
      'question_text',
      'ocr_text',
      'diagram_data',
    ]);
    const visit = (value: unknown): void => {
      if (Array.isArray(value)) return value.forEach(visit);
      if (!value || typeof value !== 'object') return;
      for (const [key, child] of Object.entries(value)) {
        expect(forbiddenKeys.has(key)).toBe(false);
        visit(child);
      }
    };
    visit(inventory);
    expect(inventory.entries.filter((entry) => entry.duplicate_of && entry.eligible_for_pattern_analysis))
      .toEqual([]);
    expect(inventory.entries.filter((entry) => entry.same_exam_of && entry.eligible_for_pattern_analysis))
      .toEqual([]);
    for (const entry of inventory.entries.filter((candidate) => candidate.eligible_for_pattern_analysis)) {
      expect(entry.classification).toBe('question-paper');
      expect(entry.paper === 1 || entry.paper === 2).toBe(true);
      expect(entry.fetch.status).toBe('ok');
      if (entry.fetch.status === 'ok') expect(entry.fetch.format).toBe('pdf');
    }
  });
});
