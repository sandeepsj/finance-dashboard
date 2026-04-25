// Public API for the parser subsystem.
//
//   import { createDefaultPipeline } from '@/parsers';
//   const { pipeline, parsers } = createDefaultPipeline();
//   parsers.register(new HdfcRegaliaParser());
//   const result = await pipeline.run({ name: 'apr.csv', mimeType: 'text/csv', size: 1234, data: csvText });
//
// See ./README.md for the architecture and how to add a parser.

export type {
  RawFile,
  ReadOptions,
  Reader,
  ExtractedDocument,
  ExtractedPage,
  ExtractedTable,
  Parser,
  ParseResult,
  ParseWarning,
  ParseError,
  ProducedRecordKind,
} from './types';

export { Ok, Err, isOk, type Result } from './result';
export { hashBytes, hashString } from './hash';

export { ReaderRegistry, TextReader, CsvReader, XlsxReader, PdfReader, PasswordRequiredError } from './readers';
export { ParserRegistry } from './parsers/registry';
export { StatementParser, type ParseContext } from './parsers/base';
export { GenericCsvBankParser } from './parsers/genericCsvBank';
export { HdfcBankStatementParser } from './parsers/hdfcBankStatement';
export { HdfcCreditCardParser } from './parsers/hdfcCreditCard';
export { IciciCreditCardParser } from './parsers/iciciCreditCard';
export { GrowwMutualFundsParser } from './parsers/growwMutualFunds';

export { CategorizerChain, regexRule, type CategorizationRule } from './categorizers';
export { starterRules } from './categorizers/starterRules';

export { ParsePipeline, type PipelineEvent, type PipelineOptions } from './pipeline';

import { CategorizerChain } from './categorizers';
import { starterRules } from './categorizers/starterRules';
import { ParsePipeline } from './pipeline';
import { GenericCsvBankParser } from './parsers/genericCsvBank';
import { HdfcBankStatementParser } from './parsers/hdfcBankStatement';
import { HdfcCreditCardParser } from './parsers/hdfcCreditCard';
import { IciciCreditCardParser } from './parsers/iciciCreditCard';
import { GrowwMutualFundsParser } from './parsers/growwMutualFunds';
import { ParserRegistry } from './parsers/registry';
import { CsvReader, PdfReader, ReaderRegistry, TextReader, XlsxReader } from './readers';

export interface DefaultPipeline {
  readers: ReaderRegistry;
  parsers: ParserRegistry;
  categorizers: CategorizerChain;
  pipeline: ParsePipeline;
}

/** Wire the default set of readers, the example CSV parser, and starter
 *  categorization rules. Add your own parsers via `result.parsers.register(...)`. */
export function createDefaultPipeline(): DefaultPipeline {
  const readers = new ReaderRegistry()
    .register(new CsvReader())
    .register(new XlsxReader())
    .register(new PdfReader())
    .register(new TextReader());

  const parsers = new ParserRegistry()
    .register(new HdfcBankStatementParser())
    .register(new HdfcCreditCardParser())
    .register(new IciciCreditCardParser())
    .register(new GrowwMutualFundsParser())
    .register(new GenericCsvBankParser());

  const categorizers = new CategorizerChain();
  for (const rule of starterRules) categorizers.register(rule);

  const pipeline = new ParsePipeline(readers, parsers, categorizers);
  return { readers, parsers, categorizers, pipeline };
}
