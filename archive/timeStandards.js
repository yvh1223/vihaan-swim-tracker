/**
 * USA Swimming Time Standards (SCY - Short Course Yards)
 * Standards for 10 & Under age group
 * Times in seconds for easy calculation
 *
 * Source: USA Swimming Motivational Times
 */

const timeStandards = {
  '50 FR SCY': {
    age: '10',
    AAAA: 27.79,
    AAA: 29.29,
    AA: 30.99,
    A: 33.29,
    BB: 35.49,
    B: 38.99,
  },
  '100 FR SCY': {
    age: '10',
    AAAA: 1 * 60 + 0.99,    // 1:00.99
    AAA: 1 * 60 + 4.29,     // 1:04.29
    AA: 1 * 60 + 7.99,      // 1:07.99
    A: 1 * 60 + 13.39,      // 1:13.39
    BB: 1 * 60 + 18.39,     // 1:18.39
    B: 1 * 60 + 26.39,      // 1:26.39
  },
  '200 FR SCY': {
    age: '10',
    AAAA: 2 * 60 + 13.29,   // 2:13.29
    AAA: 2 * 60 + 21.09,    // 2:21.09
    AA: 2 * 60 + 29.99,     // 2:29.99
    A: 2 * 60 + 43.59,      // 2:43.59
    BB: 2 * 60 + 56.39,     // 2:56.39
    B: 3 * 60 + 16.19,      // 3:16.19
  },
  '50 BK SCY': {
    age: '10',
    AAAA: 32.89,
    AAA: 34.69,
    AA: 36.69,
    A: 39.39,
    BB: 42.09,
    B: 46.29,
  },
  '100 BK SCY': {
    age: '10',
    AAAA: 1 * 60 + 11.49,
    AAA: 1 * 60 + 15.69,
    AA: 1 * 60 + 20.29,
    A: 1 * 60 + 27.69,
    BB: 1 * 60 + 34.49,
    B: 1 * 60 + 44.99,
  },
  '50 BR SCY': {
    age: '10',
    AAAA: 36.69,
    AAA: 38.69,
    AA: 40.99,
    A: 44.09,
    BB: 47.09,
    B: 51.79,
  },
  '100 BR SCY': {
    age: '10',
    AAAA: 1 * 60 + 21.09,
    AAA: 1 * 60 + 25.99,
    AA: 1 * 60 + 31.39,
    A: 1 * 60 + 39.49,
    BB: 1 * 60 + 46.99,
    B: 2 * 60 + 0.09,
  },
  '50 FL SCY': {
    age: '10',
    AAAA: 31.29,
    AAA: 33.09,
    AA: 35.09,
    A: 37.79,
    BB: 40.49,
    B: 44.59,
  },
  '100 FL SCY': {
    age: '10',
    AAAA: 1 * 60 + 11.19,
    AAA: 1 * 60 + 15.39,
    AA: 1 * 60 + 19.99,
    A: 1 * 60 + 27.09,
    BB: 1 * 60 + 33.69,
    B: 1 * 60 + 43.89,
  },
  '100 IM SCY': {
    age: '10',
    AAAA: 1 * 60 + 10.59,
    AAA: 1 * 60 + 14.79,
    AA: 1 * 60 + 19.39,
    A: 1 * 60 + 26.59,
    BB: 1 * 60 + 33.29,
    B: 1 * 60 + 43.39,
  },
  '200 IM SCY': {
    age: '10',
    AAAA: 2 * 60 + 33.09,
    AAA: 2 * 60 + 41.39,
    AA: 2 * 60 + 50.49,
    A: 3 * 60 + 4.99,
    BB: 3 * 60 + 18.79,
    B: 3 * 60 + 40.79,
  },
};

/**
 * Convert seconds to MM:SS.SS format
 */
function secondsToTime(seconds) {
  if (!seconds) return '';

  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2);

  if (mins > 0) {
    return `${mins}:${secs.padStart(5, '0')}`;
  }
  return secs;
}

/**
 * Convert MM:SS.SS to seconds
 */
function timeToSeconds(timeStr) {
  if (!timeStr || timeStr === 'DQ' || timeStr === 'Pending') {
    return null;
  }

  if (timeStr.includes(':')) {
    const [minutes, seconds] = timeStr.split(':');
    return parseInt(minutes) * 60 + parseFloat(seconds);
  }

  return parseFloat(timeStr);
}

/**
 * Get current standard based on time
 */
function getCurrentStandard(eventName, time) {
  const standards = timeStandards[eventName];
  if (!standards) return 'Unknown';

  const timeInSeconds = typeof time === 'string' ? timeToSeconds(time) : time;
  if (!timeInSeconds) return 'N/A';

  const levels = ['AAAA', 'AAA', 'AA', 'A', 'BB', 'B'];

  for (const level of levels) {
    if (timeInSeconds <= standards[level]) {
      return level;
    }
  }

  return 'Below B';
}

/**
 * Get next standard to achieve
 */
function getNextStandard(eventName, currentTime) {
  const standards = timeStandards[eventName];
  if (!standards) return null;

  const timeInSeconds = typeof currentTime === 'string' ? timeToSeconds(currentTime) : currentTime;
  if (!timeInSeconds) return null;

  const levels = ['AAAA', 'AAA', 'AA', 'A', 'BB', 'B'];

  for (const level of levels) {
    if (timeInSeconds > standards[level]) {
      return {
        level: level,
        targetTime: standards[level],
        targetTimeFormatted: secondsToTime(standards[level]),
        gap: timeInSeconds - standards[level],
        gapFormatted: secondsToTime(timeInSeconds - standards[level]),
        percentageImprovement: ((timeInSeconds - standards[level]) / timeInSeconds * 100).toFixed(2),
      };
    }
  }

  return null;
}

/**
 * Get all standards for an event
 */
function getAllStandards(eventName) {
  const standards = timeStandards[eventName];
  if (!standards) return null;

  return {
    eventName,
    age: standards.age,
    standards: {
      AAAA: { time: standards.AAAA, formatted: secondsToTime(standards.AAAA) },
      AAA: { time: standards.AAA, formatted: secondsToTime(standards.AAA) },
      AA: { time: standards.AA, formatted: secondsToTime(standards.AA) },
      A: { time: standards.A, formatted: secondsToTime(standards.A) },
      BB: { time: standards.BB, formatted: secondsToTime(standards.BB) },
      B: { time: standards.B, formatted: secondsToTime(standards.B) },
    },
  };
}

/**
 * Calculate improvement needed for next standard
 */
function calculateImprovementNeeded(eventName, currentTime) {
  const timeInSeconds = typeof currentTime === 'string' ? timeToSeconds(currentTime) : currentTime;
  if (!timeInSeconds) return null;

  const currentStandard = getCurrentStandard(eventName, timeInSeconds);
  const nextStandard = getNextStandard(eventName, timeInSeconds);

  if (!nextStandard) {
    return {
      currentStandard,
      currentTime: timeInSeconds,
      currentTimeFormatted: secondsToTime(timeInSeconds),
      nextStandard: 'Top Standard Achieved!',
      message: 'Congratulations! Already at AAAA standard!',
    };
  }

  return {
    currentStandard,
    currentTime: timeInSeconds,
    currentTimeFormatted: secondsToTime(timeInSeconds),
    nextStandard: nextStandard.level,
    targetTime: nextStandard.targetTime,
    targetTimeFormatted: nextStandard.targetTimeFormatted,
    gap: nextStandard.gap,
    gapFormatted: nextStandard.gapFormatted,
    percentageImprovement: nextStandard.percentageImprovement,
    message: `Need to improve by ${nextStandard.gapFormatted} seconds (${nextStandard.percentageImprovement}%) to reach ${nextStandard.level}`,
  };
}

/**
 * Get progress report for a swimmer
 */
function getProgressReport(events) {
  const report = [];

  for (const event of events) {
    const improvement = calculateImprovementNeeded(event.name, event.time);
    if (improvement) {
      report.push({
        event: event.name,
        ...improvement,
      });
    }
  }

  return report;
}

// Example usage
if (require.main === module) {
  console.log('\n🏊‍♂️ USA Swimming Time Standards - Age 10 & Under\n');

  // Example 1: 50 FR SCY
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Event: 50 FR SCY');
  console.log('Current Time: 35.15');
  const result1 = calculateImprovementNeeded('50 FR SCY', '35.15');
  console.log(result1);

  // Example 2: 100 FR SCY
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Event: 100 FR SCY');
  console.log('Current Time: 1:20.11');
  const result2 = calculateImprovementNeeded('100 FR SCY', '1:20.11');
  console.log(result2);

  // Example 3: All standards for 50 FR SCY
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('All Standards for 50 FR SCY:');
  const allStandards = getAllStandards('50 FR SCY');
  console.log(JSON.stringify(allStandards, null, 2));

  // Example 4: Progress report
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Vihaan\'s Progress Report:');
  const vihaanEvents = [
    { name: '50 FR SCY', time: '35.15' },
    { name: '100 FR SCY', time: '1:20.11' },
    { name: '50 BK SCY', time: '41.60' },
    { name: '50 BR SCY', time: '44.10' },
  ];
  const report = getProgressReport(vihaanEvents);
  report.forEach(item => {
    console.log(`\n${item.event}:`);
    console.log(`  Current: ${item.currentTimeFormatted} (${item.currentStandard})`);
    console.log(`  ${item.message}`);
  });
}

module.exports = {
  timeStandards,
  secondsToTime,
  timeToSeconds,
  getCurrentStandard,
  getNextStandard,
  getAllStandards,
  calculateImprovementNeeded,
  getProgressReport,
};
