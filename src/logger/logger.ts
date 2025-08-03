class Logger {
  private debug = true;

  info(...msg: unknown[]) {
    if (!this.debug) {
      return;
    }

    console.log(...msg);
  }

  error(...msg: unknown[]) {
    if (!this.debug) {
      return;
    }

    console.error(...msg);
  }

  warn(...msg: unknown[]) {
    if (!this.debug) {
      return;
    }

    console.warn(...msg);
  }
}

export const logger = new Logger();
