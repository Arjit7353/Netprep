require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const Question = require('../models/Question');

const DRY_RUN = process.argv.includes('--dry-run');
const SAMPLE_LIMIT = 5;

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const HINDI_OPTION_LABELS = ['ए', 'बी', 'सी', 'डी', 'ई', 'एफ', 'जी', 'एच'];
const ROMAN_TO_DIGIT = new Map(ROMANS.map((roman, index) => [roman, String(index + 1)]));
const DIGIT_TO_ROMAN = new Map(ROMANS.map((roman, index) => [String(index + 1), roman]));

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isHindiText(value) {
  return /[\u0900-\u097F]/.test(value || '');
}

function getExpectedLabels(index) {
  return {
    letter: LETTERS[index] || '',
    digit: String(index + 1),
    roman: ROMANS[index] || ''
  };
}

function hasStrongLetterLabel(item, index) {
  if (!item || typeof item !== 'string') return false;

  const expected = getExpectedLabels(index).letter;
  if (!expected) return false;

  const trimmed = item.trimStart();
  const letter = escapeRegExp(expected);
  const exactLabelPattern = new RegExp(`^(?:\\(${letter}\\)|${letter}\\))\\s+`, 'i');
  const dotPattern = new RegExp(`^(${letter})\\.(\\s*)`, 'i');

  if (exactLabelPattern.test(trimmed)) return true;

  const dotMatch = trimmed.match(dotPattern);
  if (!dotMatch) return false;

  const rest = trimmed.slice(dotMatch[0].length);
  return dotMatch[1] === dotMatch[1].toLowerCase()
    || dotMatch[2] === ''
    || isHindiText(rest);
}

function listHasStrongLetterLabels(items) {
  if (!Array.isArray(items)) return false;
  let count = 0;
  for (let index = 0; index < items.length; index++) {
    if (hasStrongLetterLabel(items[index], index)) count++;
  }
  return count >= 2;
}

function stripExpectedPrefix(value, index, hasLetterContext) {
  if (!value || typeof value !== 'string') return value;

  let text = value.trim();
  const { letter, digit, roman } = getExpectedLabels(index);

  if (letter) {
    const escapedLetter = escapeRegExp(letter);
    const parenthesizedLetter = new RegExp(`^\\(${escapedLetter}\\)\\s*`, 'i');
    const closingLetter = new RegExp(`^${escapedLetter}\\)\\s*`, 'i');
    const letterDot = new RegExp(`^(${escapedLetter})\\.(\\s*)`, 'i');

    text = text.replace(parenthesizedLetter, '');
    text = text.replace(closingLetter, '');

    const dotMatch = text.match(letterDot);
    if (dotMatch) {
      const rest = text.slice(dotMatch[0].length);
      const shouldRemoveDotPrefix = dotMatch[1] === dotMatch[1].toLowerCase()
        || dotMatch[2] === ''
        || isHindiText(rest)
        || hasLetterContext;

      if (shouldRemoveDotPrefix) {
        text = rest;
      }
    }
  }

  if (digit) {
    const escapedDigit = escapeRegExp(digit);
    text = text.replace(new RegExp(`^\\(${escapedDigit}\\)\\s*`), '');
    text = text.replace(new RegExp(`^${escapedDigit}[.)]\\s*`), '');
  }

  if (roman) {
    const escapedRoman = escapeRegExp(roman);
    text = text.replace(new RegExp(`^\\(${escapedRoman}\\)\\s*`, 'i'), '');
    text = text.replace(new RegExp(`^${escapedRoman}[.)]\\s*`, 'i'), '');
  }

  return text.trim();
}

function cleanListItems(items) {
  if (!Array.isArray(items)) return { value: items, changed: false, changes: [] };

  const hasLetterContext = listHasStrongLetterLabels(items);
  const cleaned = [];
  const changes = [];

  for (let index = 0; index < items.length; index++) {
    const before = items[index];
    let after = before;

    for (let pass = 0; pass < 3; pass++) {
      const next = stripExpectedPrefix(after, index, hasLetterContext);
      if (next === after) break;
      after = next;
    }

    cleaned.push(after);
    if (before !== after) {
      changes.push({ index, before, after });
    }
  }

  return { value: cleaned, changed: changes.length > 0, changes };
}

function normalizeMatchValue(rawValue, listBValueToRoman) {
  const value = String(rawValue || '').trim().replace(/^\((.*)\)$/, '$1').trim();
  const romanKey = value.toUpperCase();
  const contentKey = value.toLowerCase();

  if (DIGIT_TO_ROMAN.has(value)) return DIGIT_TO_ROMAN.get(value);
  if (ROMAN_TO_DIGIT.has(romanKey)) return romanKey;
  if (listBValueToRoman.has(contentKey)) return listBValueToRoman.get(contentKey);

  return value;
}

function stripOptionChoicePrefix(value, index) {
  if (!value || typeof value !== 'string') return value;

  const expected = LETTERS[index] || '';
  if (!expected) return value.trim();

  const escaped = escapeRegExp(expected);
  const hindiLabel = HINDI_OPTION_LABELS[index] || '';
  const escapedHindi = hindiLabel ? escapeRegExp(hindiLabel) : null;

  let text = value
    .trim()
    .replace(new RegExp(`^\\(${escaped}\\)\\s+`, 'i'), '')
    .replace(new RegExp(`^${escaped}[.)]\\s+`, 'i'), '')
    .trim();

  if (escapedHindi) {
    text = text
      .replace(new RegExp(`^${escapedHindi}[.)।]?\\s+`, 'i'), '')
      .trim();
  }

  return text;
}

function buildListBValueMap(...groups) {
  const valueToRoman = new Map();

  for (const items of groups) {
    if (!Array.isArray(items)) continue;

    for (let index = 0; index < items.length && index < ROMANS.length; index++) {
      const value = String(items[index] || '').trim();
      if (!value) continue;
      valueToRoman.set(value.toLowerCase(), ROMANS[index]);
    }
  }

  return valueToRoman;
}

function normalizeOptionText(value, index, listBValueToRoman) {
  if (!value || typeof value !== 'string') return value;

  let text = stripOptionChoicePrefix(value, index);

  text = text.replace(/^\s*[-–—]\s*\(?\s*([^,;()]+?)\s*\)?(?=\s*(?:[,;]|$))/, (_match, rawMatchValue) => {
    const normalized = normalizeMatchValue(rawMatchValue, listBValueToRoman);
    return `A-${normalized}`;
  });

  text = text.replace(/(^|[\s,;])\(?([A-Ha-h])\)?\s*[-–—]\s*\(?\s*([^,;()]+?)\s*\)?(?=\s*(?:[,;]|$))/g, (_match, prefix, letter, rawMatchValue) => {
    const normalized = normalizeMatchValue(rawMatchValue, listBValueToRoman);
    return `${prefix}${letter.toUpperCase()}-${normalized}`;
  });

  return text;
}

function normalizeOptions(options, listBValueToRoman) {
  if (!Array.isArray(options)) return { value: options, changed: false, changes: [] };

  const normalized = [];
  const changes = [];

  for (let index = 0; index < options.length; index++) {
    const before = options[index];
    const after = normalizeOptionText(before, index, listBValueToRoman);
    normalized.push(after);

    if (before !== after) {
      changes.push({ index, before, after });
    }
  }

  return { value: normalized, changed: changes.length > 0, changes };
}

function repairQuestion(question) {
  const update = {};
  const changes = {};

  const listAHi = cleanListItems(question.matchData?.listA?.hi || []);
  const listAEn = cleanListItems(question.matchData?.listA?.en || []);
  const listBHi = cleanListItems(question.matchData?.listB?.hi || []);
  const listBEn = cleanListItems(question.matchData?.listB?.en || []);
  const listBValueToRoman = buildListBValueMap(listBHi.value, listBEn.value);
  const optionsHi = normalizeOptions(question.options?.hi || [], listBValueToRoman);
  const optionsEn = normalizeOptions(question.options?.en || [], listBValueToRoman);

  if (listAHi.changed) {
    update['matchData.listA.hi'] = listAHi.value;
    changes.listA_hi = listAHi.changes;
  }
  if (listAEn.changed) {
    update['matchData.listA.en'] = listAEn.value;
    changes.listA_en = listAEn.changes;
  }
  if (listBHi.changed) {
    update['matchData.listB.hi'] = listBHi.value;
    changes.listB_hi = listBHi.changes;
  }
  if (listBEn.changed) {
    update['matchData.listB.en'] = listBEn.value;
    changes.listB_en = listBEn.changes;
  }
  if (optionsHi.changed) {
    update['options.hi'] = optionsHi.value;
    changes.options_hi = optionsHi.changes;
  }
  if (optionsEn.changed) {
    update['options.en'] = optionsEn.value;
    changes.options_en = optionsEn.changes;
  }

  return {
    modified: Object.keys(update).length > 0,
    update,
    changes
  };
}

function hasNumericOptionMapping(value) {
  return /(^|[\s,;])\(?[A-Ha-h]\)?\s*[-–—]\s*\(?\s*(10|[1-9])\s*\)?(?=\s*(?:[,;]|$))/i.test(value || '');
}

function hasMalformedRomanOptionMapping(value) {
  const romanPattern = '(VIII|VII|VI|IV|IX|III|II|X|V|I)';
  const mappingPattern = new RegExp(`(^|[\\s,;])\\(?([A-Ha-h])\\)?\\s*[-–—]\\s*\\(?\\s*${romanPattern}\\s*\\)?(?=\\s*(?:[,;]|$))`, 'gi');
  const matches = value?.match(mappingPattern) || [];
  return matches.some(match => !/^(?:[,;]\s*)?[A-H]-(VIII|VII|VI|IV|IX|III|II|X|V|I)$/.test(match.trim()));
}

function hasListBValueOptionMapping(value, listBValueToRoman) {
  if (!value || typeof value !== 'string') return false;

  const matches = value.matchAll(/(^|[\s,;])\(?[A-Ha-h]\)?\s*[-–—]\s*\(?\s*([^,;()]+?)\s*\)?(?=\s*(?:[,;]|$))/g);
  for (const match of matches) {
    const rawValue = String(match[2] || '').trim().replace(/^\((.*)\)$/, '$1').trim();
    const key = rawValue.toLowerCase();

    if (listBValueToRoman.has(key) && !ROMAN_TO_DIGIT.has(rawValue.toUpperCase())) {
      return true;
    }
  }

  return false;
}

function hasActionableListPrefix(item, index, hasLetterContext) {
  if (!item || typeof item !== 'string') return false;
  const cleaned = stripExpectedPrefix(item, index, hasLetterContext);
  return cleaned !== item.trim();
}

function formatSample(question, result) {
  return {
    questionNumber: question.questionNumber || null,
    id: question._id.toString(),
    changes: result.changes
  };
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000
  });

  const questions = await Question.find({ questionType: 'match_following' }).lean();
  const operations = [];
  const samples = [];

  const stats = {
    totalScanned: questions.length,
    totalFixed: 0,
    totalSkipped: 0,
    totalErrors: 0
  };

  for (const question of questions) {
    try {
      const result = repairQuestion(question);

      if (!result.modified) {
        stats.totalSkipped++;
        continue;
      }

      stats.totalFixed++;
      if (samples.length < SAMPLE_LIMIT) {
        samples.push(formatSample(question, result));
      }

      operations.push({
        updateOne: {
          filter: { _id: question._id },
          update: { $set: result.update }
        }
      });
    } catch (error) {
      stats.totalErrors++;
      if (samples.length < SAMPLE_LIMIT) {
        samples.push({
          questionNumber: question.questionNumber || null,
          id: question._id.toString(),
          error: error.message
        });
      }
    }
  }

  let bulkResult = null;
  if (!DRY_RUN && operations.length > 0) {
    bulkResult = await Question.bulkWrite(operations, { ordered: false });
  }

  const verifyQuestions = !DRY_RUN
    ? await Question.find({ questionType: 'match_following' }).lean()
    : questions.map(question => {
        const result = repairQuestion(question);
        if (!result.modified) return question;
        const clone = JSON.parse(JSON.stringify(question));
        for (const [path, value] of Object.entries(result.update)) {
          const parts = path.split('.');
          let target = clone;
          while (parts.length > 1) target = target[parts.shift()];
          target[parts[0]] = value;
        }
        return clone;
      });

  const verification = {
    optionQuestionsWithDigits: 0,
    optionQuestionsWithMalformedRoman: 0,
    optionQuestionsWithListBValues: 0,
    listQuestionsWithActionablePrefixes: 0
  };

  for (const question of verifyQuestions) {
    const options = [...(question.options?.hi || []), ...(question.options?.en || [])];
    const listBValueToRoman = buildListBValueMap(
      question.matchData?.listB?.hi || [],
      question.matchData?.listB?.en || []
    );

    if (options.some(hasNumericOptionMapping)) verification.optionQuestionsWithDigits++;
    if (options.some(hasMalformedRomanOptionMapping)) verification.optionQuestionsWithMalformedRoman++;
    if (options.some(option => hasListBValueOptionMapping(option, listBValueToRoman))) {
      verification.optionQuestionsWithListBValues++;
    }

    const listGroups = [
      question.matchData?.listA?.hi || [],
      question.matchData?.listA?.en || [],
      question.matchData?.listB?.hi || [],
      question.matchData?.listB?.en || []
    ];

    if (listGroups.some(items => {
      const hasLetterContext = listHasStrongLetterLabels(items);
      return items.some((item, index) => hasActionableListPrefix(item, index, hasLetterContext));
    })) {
      verification.listQuestionsWithActionablePrefixes++;
    }
  }

  const report = {
    mode: DRY_RUN ? 'dry-run' : 'live',
    stats,
    databaseWrites: bulkResult ? {
      matched: bulkResult.matchedCount,
      modified: bulkResult.modifiedCount
    } : {
      matched: 0,
      modified: 0
    },
    verification,
    samples
  };

  console.log(JSON.stringify(report, null, 2));
  await mongoose.disconnect();
}

main().catch(async error => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch (_) {
    // Ignore disconnect errors during fatal exits.
  }
  process.exit(1);
});
