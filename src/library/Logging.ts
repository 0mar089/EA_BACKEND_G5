import chalk from 'chalk';

export default class Logging {
    public static log = (args: any) => this.info(args);

    public static info = (args: any) =>
        console.log(
            chalk.gray(`[${new Date().toLocaleString()}]`) +
            chalk.green.bold(` [INFO]  `) +
            (typeof args === 'string' ? chalk.greenBright(args) : args)
        );

    public static warning = (args: any) =>
        console.log(
            chalk.gray(`[${new Date().toLocaleString()}]`) +
            chalk.yellow.bold(` [WARN]  `) +
            (typeof args === 'string' ? chalk.yellowBright(args) : args)
        );

    public static error = (args: any) =>
        console.log(
            chalk.gray(`[${new Date().toLocaleString()}]`) +
            chalk.red.bold(` [ERROR] `) +
            (typeof args === 'string' ? chalk.redBright(args) : args)
        );
}
