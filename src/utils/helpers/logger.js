import winston from "winston";

const format = winston.format.printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
  });

/**
 * @function initializeLogger
 * @description
 * Initializes and configures a new winston logger instance with a custom format and file transports for
 * error and combined logs. The logs are saved in a folder named with the current date (year-month-day).
 *
 * @returns {winston.Logger} - The configured winston logger instance.
 */
const initializeLogger = ()=>{
    const date= new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    const logger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(winston.format.timestamp(), format),
        transports: [
            new winston.transports.File({
                filename: `logs/${year}-${month}-${day}/error.log`,
                level: 'error'
            }),
            new winston.transports.File({
                filename: `logs/${year}-${month}-${day}/combined.log`
            })
        ]
    });
    return logger;
}


/**
 * @class logger
 * @description
 * A wrapper class for the winston logger that provides a method to add logs with a specified log level
 * and message.
 */
class logger {
    
/**
 * @method logger#constructor
 * @description
 * Initializes a new logger instance by calling the initializeLogger function and assigning the returned
 * winston logger instance to the class property 'logger'.
 */
    constructor(){
        this.logger = initializeLogger();
    }

/**
 * @method logger#addLog
 * @description
 * Adds a log entry to the winston logger with the specified log level and message.
 *
 * @param {string} logLevel - The log level for the log entry (e.g., 'info', 'error', etc.).
 * @param {string} message - The message to be logged.
 */
    addLog(logLevel,message){
        this.logger.log(logLevel,message);
    }
}

export const log = new logger();

