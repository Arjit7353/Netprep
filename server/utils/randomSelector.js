const Question = require('../models/Question');

class RandomSelector {
  /**
   * Select random questions based on criteria
   * @param {Object} options - Selection options
   * @returns {Promise<Array>} Selected questions
   */
  async selectRandomQuestions(options) {
    const {
      paper,
      questionsPerUnit,
      totalQuestions,
      priority = 'unattempted',
      excludeIds = [],
      difficulty,
      questionTypes
    } = options;

    let allQuestions = [];

    // If questionsPerUnit is specified, select from each unit
    if (questionsPerUnit) {
      const units = await this.getUnitsForPaper(paper);

      for (const unit of units) {
        const count = typeof questionsPerUnit === 'object' 
          ? (questionsPerUnit[unit] || 5)
          : questionsPerUnit;

        const unitQuestions = await this.selectFromUnit({
          paper,
          unit,
          count,
          priority,
          excludeIds,
          difficulty,
          questionTypes
        });

        allQuestions.push(...unitQuestions);
      }
    } else if (totalQuestions) {
      // Select total questions randomly from all units
      allQuestions = await this.selectTotal({
        paper,
        count: totalQuestions,
        priority,
        excludeIds,
        difficulty,
        questionTypes
      });
    }

    return allQuestions;
  }

  /**
   * Get all units for a paper
   * @param {string} paper - Paper type
   * @returns {Promise<Array>} List of units
   */
  async getUnitsForPaper(paper) {
    const units = await Question.distinct('unit', {
      paper,
      isActive: true
    });

    return units.filter(u => u); // Remove null/empty
  }

  /**
   * Select questions from a specific unit
   * @param {Object} options - Selection options
   * @returns {Promise<Array>} Selected questions
   */
  async selectFromUnit(options) {
    const {
      paper,
      unit,
      count,
      priority,
      excludeIds,
      difficulty,
      questionTypes
    } = options;

    // Build base filter
    const baseFilter = {
      paper,
      unit,
      isActive: true,
      _id: { $nin: excludeIds }
    };

    if (difficulty) {
      baseFilter.difficulty = difficulty;
    }

    if (questionTypes && questionTypes.length > 0) {
      baseFilter.questionType = { $in: questionTypes };
    }

    let selectedQuestions = [];

    // Priority-based selection
    if (priority === 'unattempted') {
      // First, try to get unattempted questions
      selectedQuestions = await this.getUnattemptedQuestions(baseFilter, count);

      // If not enough, get low accuracy questions
      if (selectedQuestions.length < count) {
        const remaining = count - selectedQuestions.length;
        const existingIds = selectedQuestions.map(q => q._id);
        
        const lowAccuracyQuestions = await this.getLowAccuracyQuestions(
          { ...baseFilter, _id: { $nin: [...excludeIds, ...existingIds] } },
          remaining
        );
        
        selectedQuestions.push(...lowAccuracyQuestions);
      }

      // If still not enough, get random from remaining
      if (selectedQuestions.length < count) {
        const remaining = count - selectedQuestions.length;
        const existingIds = selectedQuestions.map(q => q._id);
        
        const randomQuestions = await this.getRandomQuestions(
          { ...baseFilter, _id: { $nin: [...excludeIds, ...existingIds] } },
          remaining
        );
        
        selectedQuestions.push(...randomQuestions);
      }
    } else if (priority === 'low_accuracy') {
      selectedQuestions = await this.getLowAccuracyQuestions(baseFilter, count);

      if (selectedQuestions.length < count) {
        const remaining = count - selectedQuestions.length;
        const existingIds = selectedQuestions.map(q => q._id);
        
        const randomQuestions = await this.getRandomQuestions(
          { ...baseFilter, _id: { $nin: [...excludeIds, ...existingIds] } },
          remaining
        );
        
        selectedQuestions.push(...randomQuestions);
      }
    } else {
      // Random selection
      selectedQuestions = await this.getRandomQuestions(baseFilter, count);
    }

    return selectedQuestions;
  }

  /**
   * Select total questions randomly
   * @param {Object} options - Selection options
   * @returns {Promise<Array>} Selected questions
   */
  async selectTotal(options) {
    const {
      paper,
      count,
      priority,
      excludeIds,
      difficulty,
      questionTypes
    } = options;

    const baseFilter = {
      paper,
      isActive: true,
      _id: { $nin: excludeIds }
    };

    if (difficulty) {
      baseFilter.difficulty = difficulty;
    }

    if (questionTypes && questionTypes.length > 0) {
      baseFilter.questionType = { $in: questionTypes };
    }

    let selectedQuestions = [];

    if (priority === 'unattempted') {
      selectedQuestions = await this.getUnattemptedQuestions(baseFilter, count);

      if (selectedQuestions.length < count) {
        const remaining = count - selectedQuestions.length;
        const existingIds = selectedQuestions.map(q => q._id);
        
        const moreQuestions = await this.getRandomQuestions(
          { ...baseFilter, _id: { $nin: [...excludeIds, ...existingIds] } },
          remaining
        );
        
        selectedQuestions.push(...moreQuestions);
      }
    } else {
      selectedQuestions = await this.getRandomQuestions(baseFilter, count);
    }

    return selectedQuestions;
  }

  /**
   * Get unattempted questions
   * @param {Object} filter - MongoDB filter
   * @param {number} count - Number of questions
   * @returns {Promise<Array>} Questions
   */
  async getUnattemptedQuestions(filter, count) {
    return Question.aggregate([
      { $match: { ...filter, timesAttempted: 0 } },
      { $sample: { size: count } }
    ]);
  }

  /**
   * Get questions with low accuracy
   * @param {Object} filter - MongoDB filter
   * @param {number} count - Number of questions
   * @returns {Promise<Array>} Questions
   */
  async getLowAccuracyQuestions(filter, count) {
    return Question.aggregate([
      { $match: { ...filter, timesAttempted: { $gt: 0 } } },
      {
        $addFields: {
          accuracy: {
            $cond: [
              { $gt: ['$timesAttempted', 0] },
              { $divide: ['$timesCorrect', '$timesAttempted'] },
              0
            ]
          }
        }
      },
      { $match: { accuracy: { $lt: 0.5 } } },
      { $sample: { size: count } }
    ]);
  }

  /**
   * Get random questions
   * @param {Object} filter - MongoDB filter
   * @param {number} count - Number of questions
   * @returns {Promise<Array>} Questions
   */
  async getRandomQuestions(filter, count) {
    return Question.aggregate([
      { $match: filter },
      { $sample: { size: count } }
    ]);
  }

  /**
   * Get question distribution stats
   * @param {string} paper - Paper type
   * @returns {Promise<Object>} Distribution stats
   */
  async getDistributionStats(paper) {
    const stats = await Question.aggregate([
      { $match: { paper, isActive: true } },
      {
        $group: {
          _id: '$unit',
          total: { $sum: 1 },
          unattempted: {
            $sum: { $cond: [{ $eq: ['$timesAttempted', 0] }, 1, 0] }
          },
          attempted: {
            $sum: { $cond: [{ $gt: ['$timesAttempted', 0] }, 1, 0] }
          },
          byDifficulty: {
            $push: '$difficulty'
          },
          byType: {
            $push: '$questionType'
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Process byDifficulty and byType
    return stats.map(unitStat => {
      const difficultyCount = unitStat.byDifficulty.reduce((acc, d) => {
        acc[d] = (acc[d] || 0) + 1;
        return acc;
      }, {});

      const typeCount = unitStat.byType.reduce((acc, t) => {
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {});

      return {
        unit: unitStat._id,
        total: unitStat.total,
        unattempted: unitStat.unattempted,
        attempted: unitStat.attempted,
        byDifficulty: difficultyCount,
        byType: typeCount
      };
    });
  }

  /**
   * Select questions for DPP
   * @param {Object} options - Options
   * @returns {Promise<Array>} Questions
   */
  async selectForDPP(options) {
    const { paper, topic, chapter, unit, count = 10 } = options;

    const filter = { paper, isActive: true };

    if (topic) filter.topic = topic;
    else if (chapter) filter.chapter = chapter;
    else if (unit) filter.unit = unit;

    // For DPP, prioritize variety in question types
    const questions = await Question.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$questionType',
          questions: { $push: '$$ROOT' }
        }
      },
      {
        $project: {
          questions: { $slice: ['$questions', 2] } // Max 2 of each type
        }
      },
      { $unwind: '$questions' },
      { $replaceRoot: { newRoot: '$questions' } },
      { $sample: { size: count } }
    ]);

    // If not enough questions, get more randomly
    if (questions.length < count) {
      const existingIds = questions.map(q => q._id);
      const more = await this.getRandomQuestions(
        { ...filter, _id: { $nin: existingIds } },
        count - questions.length
      );
      questions.push(...more);
    }

    return questions;
  }

  /**
   * Select balanced questions (mix of difficulty)
   * @param {Object} options - Options
   * @returns {Promise<Array>} Questions
   */
  async selectBalanced(options) {
    const { paper, unit, count } = options;

    const filter = { paper, isActive: true };
    if (unit) filter.unit = unit;

    // Distribution: 30% easy, 50% medium, 20% hard
    const easyCount = Math.round(count * 0.3);
    const hardCount = Math.round(count * 0.2);
    const mediumCount = count - easyCount - hardCount;

    const easyQuestions = await this.getRandomQuestions(
      { ...filter, difficulty: 'easy' },
      easyCount
    );

    const mediumQuestions = await this.getRandomQuestions(
      { ...filter, difficulty: 'medium' },
      mediumCount
    );

    const hardQuestions = await this.getRandomQuestions(
      { ...filter, difficulty: 'hard' },
      hardCount
    );

    const allQuestions = [...easyQuestions, ...mediumQuestions, ...hardQuestions];

    // Shuffle
    return this.shuffleArray(allQuestions);
  }

  /**
   * Shuffle array (Fisher-Yates algorithm)
   * @param {Array} array - Array to shuffle
   * @returns {Array} Shuffled array
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

module.exports = new RandomSelector();