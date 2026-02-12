const Test = require('../models/Test');
const config = require('../config/config');

class AutoGenerator {
  /**
   * Generate unique test title based on test type and parameters
   * @param {Object} testData - Test data containing testType, topic, chapter, unit, etc.
   * @returns {Promise<string>} Generated title
   */
  async generateTestTitle(testData) {
    const { testType, topic, chapter, unit, paper, year, session } = testData;
    const typeConfig = config.testTypes[testType];

    if (!typeConfig) {
      return `Test ${Date.now()}`;
    }

    let baseTitle = '';
    let pattern = typeConfig.titlePattern;

    // Replace placeholders based on test type
    switch (testType) {
      case 'dpp':
        baseTitle = topic || chapter || unit || 'General';
        pattern = pattern.replace('{topic}', baseTitle);
        break;

      case 'topic_test':
        baseTitle = topic || 'General Topic';
        pattern = pattern.replace('{topic}', baseTitle);
        break;

      case 'chapter_test':
        baseTitle = chapter || 'General Chapter';
        pattern = pattern.replace('{chapter}', baseTitle);
        break;

      case 'unit_test':
        baseTitle = unit || 'General Unit';
        pattern = pattern.replace('{unit}', baseTitle);
        break;

      case 'pyq_year':
        pattern = pattern.replace('{year}', year || new Date().getFullYear().toString());
        pattern = pattern.replace('{session}', session || 'June');
        break;

      case 'practice':
        // Just use number
        break;

      case 'full_mock_p1':
      case 'full_mock_p2':
      case 'full_mock_combined':
        // Just use number
        break;

      default:
        pattern = `${typeConfig.name} {number}`;
    }

    // Find the next available number
    const number = await this.getNextTestNumber(testType, pattern.replace('{number}', ''));
    const finalTitle = pattern.replace('{number}', number.toString());

    return finalTitle;
  }

  /**
   * Get next available test number for a given pattern
   * @param {string} testType - Type of test
   * @param {string} basePattern - Base pattern without number
   * @returns {Promise<number>} Next available number
   */
  async getNextTestNumber(testType, basePattern) {
    // Find all tests with similar pattern
    const escapedPattern = basePattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escapedPattern}\\d+$`);

    const existingTests = await Test.find({
      testType,
      title: { $regex: regex }
    }).select('title');

    if (existingTests.length === 0) {
      return 1;
    }

    // Extract numbers and find max
    const numbers = existingTests.map(test => {
      const match = test.title.match(/(\d+)$/);
      return match ? parseInt(match[1]) : 0;
    });

    return Math.max(...numbers) + 1;
  }

  /**
   * Get default instructions for test
   * @param {Object} testData - Test data
   * @returns {Object} Instructions in both languages
   */
  getDefaultInstructions(testData) {
    const { testType, negativeMarking, marksPerQuestion = 2 } = testData;
    const typeConfig = config.testTypes[testType];

    const instructions = {
      en: [...config.defaultInstructions.en],
      hi: [...config.defaultInstructions.hi]
    };

    // Add specific instructions based on test type
    if (typeConfig) {
      instructions.en.unshift(`This is a ${typeConfig.name}.`);
      instructions.hi.unshift(`यह एक ${typeConfig.nameHi} है।`);
    }

    // Add marks info
    instructions.en.push(`Each question carries ${marksPerQuestion} marks.`);
    instructions.hi.push(`प्रत्येक प्रश्न ${marksPerQuestion} अंक का है।`);

    // Add negative marking info
    if (negativeMarking) {
      instructions.en.push('There is negative marking for wrong answers.');
      instructions.hi.push('गलत उत्तर के लिए नकारात्मक अंकन है।');
    }

    // Add time info for full mocks
    if (testType?.includes('full_mock')) {
      instructions.en.push('Manage your time wisely across all questions.');
      instructions.hi.push('सभी प्रश्नों में अपना समय बुद्धिमानी से प्रबंधित करें।');
    }

    return instructions;
  }

  /**
   * Generate short code for test
   * @param {string} testType - Type of test
   * @param {number} number - Test number
   * @returns {string} Short code
   */
  generateShortCode(testType, number) {
    const typeConfig = config.testTypes[testType];
    const shortCode = typeConfig?.shortCode || 'T';
    return `${shortCode}-${number.toString().padStart(3, '0')}`;
  }

  /**
   * Generate question reference code
   * @param {string} paper - Paper (paper1/paper2)
   * @param {string} unit - Unit name/id
   * @param {number} questionNumber - Question number
   * @returns {string} Reference code
   */
  generateQuestionCode(paper, unit, questionNumber) {
    const paperCode = paper === 'paper1' ? 'P1' : 'P2';
    const unitCode = unit?.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() || 'GEN';
    return `${paperCode}-${unitCode}-${questionNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Format duration for display
   * @param {number} minutes - Duration in minutes
   * @returns {Object} Formatted duration
   */
  formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return {
      hours,
      minutes: mins,
      display: hours > 0 ? `${hours}h ${mins}m` : `${mins} min`,
      displayHi: hours > 0 ? `${hours} घंटा ${mins} मिनट` : `${mins} मिनट`,
      totalSeconds: minutes * 60
    };
  }

  /**
   * Format date for display
   * @param {Date} date - Date object
   * @param {string} language - Language (en/hi)
   * @returns {string} Formatted date
   */
  formatDate(date, language = 'en') {
    const d = new Date(date);
    
    if (language === 'hi') {
      const months = [
        'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
        'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
      ];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }

    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Generate attempt summary text
   * @param {Object} attempt - Attempt data
   * @param {string} language - Language
   * @returns {string} Summary text
   */
  generateAttemptSummary(attempt, language = 'en') {
    const { correctCount, wrongCount, skippedCount, percentage, accuracy } = attempt;

    if (language === 'hi') {
      return `आपने ${correctCount} सही, ${wrongCount} गलत और ${skippedCount} छोड़े। प्रतिशत: ${percentage}%, सटीकता: ${accuracy}%`;
    }

    return `You got ${correctCount} correct, ${wrongCount} wrong, and ${skippedCount} skipped. Percentage: ${percentage}%, Accuracy: ${accuracy}%`;
  }
}

module.exports = new AutoGenerator();