import natural from 'natural';
import { removeStopwords, eng } from 'stopword';

const DEFAULT_COUNT = 5;
const DEFAULT_MIN_COUNT = 3;
const DEFAULT_MIN_LENGTH = 4;

const tokenizer = new natural.WordTokenizer();
const importantTags = new Set([
  'NN',
  'NNS',
  'NNP',
  'NNPS',
  'VB',
  'VBD',
  'VBG',
  'VBN',
  'VBP',
  'VBZ',
]);
const language = 'EN';
const defaultCategory = 'N';
const defaultCategoryCapitalized = 'NNP';

const lexicon = new natural.Lexicon(
  language,
  defaultCategory,
  defaultCategoryCapitalized
);
const ruleSet = new natural.RuleSet('EN');
const tagger = new natural.BrillPOSTagger(lexicon, ruleSet);

const toObjectList = (frequencyCounts) => {
  return Object.keys(frequencyCounts).map((key) => {
    return {
      word: key,
      count: frequencyCounts[key],
    };
  });
};

/**
 * Analyze Text for the Top Keywords using NLTK/Natural.
 * @param {*} param0
 * @returns
 */
export const topKeywords = ({
  text,
  count = DEFAULT_COUNT,
  minCount = DEFAULT_MIN_COUNT,
  minLength = DEFAULT_MIN_LENGTH
}) => {
  const tokens = tokenizer.tokenize(text);
  const filteredTokens = removeStopwords(tokens, eng);
  const taggedWords = tagger.tag(filteredTokens).taggedWords;
  const importantTokens = taggedWords.filter((token) => importantTags.has(token.tag)).map((token) => token.token);
  // Count the frequency of each remaining word and sort them by frequency
  const frequencyCounts = importantTokens.reduce((counts, token) => {
    const key = token.toLowerCase();
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});

  const sortedKeywords = toObjectList(frequencyCounts)
    .sort((a, b) => b.count - a.count)
    .filter((item) => item.count >= minCount && item.word.length >= minLength);

  const topKeywords = sortedKeywords.slice(0, count);
  return topKeywords;
};

const keywords = {
  topKeywords,
};

export default keywords;
