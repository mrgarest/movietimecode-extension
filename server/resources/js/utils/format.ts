/**
 * Converts the number of seconds into an object with strings of hours, minutes, and seconds.
 * @param seconds
 * @returns An object { hours, minutes, seconds } in string format.
 */
export const secondsToTimeHMS = (
  seconds: number
): { hours: string; minutes: string; seconds: string } => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return {
    hours: addZeroToTime(hours),
    minutes: addZeroToTime(minutes),
    seconds: addZeroToTime(remainingSeconds),
  };
};

/**
 * Adds a leading zero to the number if it is less than 10 and returns the string.
 * @param time
 * @returns Leading zero, if necessary.
 */
const addZeroToTime = (time: number): string =>
  `${time < 10 ? "0" + time : time}`;

/**
 * Converts a number of seconds to a time format (HH:MM:SS).
 * @param seconds Number of seconds.
 * @returns Time in HH:MM:SS format.
 */
export const secondsToTime = (seconds: number): string => {
  if (seconds < 0 || isNaN(seconds)) {
    console.warn("Invalid seconds value:", seconds);
    return "00:00:00";
  }
  const hms = secondsToTimeHMS(seconds);
  return [hms.hours, hms.minutes, hms.seconds]
    .map((time) => time.toString().padStart(2, "0"))
    .join(":");
};
