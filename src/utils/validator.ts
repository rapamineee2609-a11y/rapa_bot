export class Validator {
  private static instance: Validator;

  private constructor() {}

  public static getInstance(): Validator {
    if (!Validator.instance) {
      Validator.instance = new Validator();
    }
    return Validator.instance;
  }

  public isValidUrl(str: string): boolean {
    try {
      const url = new URL(str);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  public isValidNumber(str: string): boolean {
    return /^[0-9]+$/.test(str);
  }

  public isValidEmail(str: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  }

  public isValidPhoneNumber(str: string): boolean {
    return /^\+?[0-9]{10,15}$/.test(str.replace(/[^0-9+]/g, ''));
  }

  public isNumeric(str: string): boolean {
    return !isNaN(Number(str)) && str.trim() !== '';
  }

  public isAlpha(str: string): boolean {
    return /^[a-zA-Z\s]+$/.test(str);
  }

  public isAlphanumeric(str: string): boolean {
    return /^[a-zA-Z0-9\s]+$/.test(str);
  }

  public minLength(str: string, min: number): boolean {
    return str.length >= min;
  }

  public maxLength(str: string, max: number): boolean {
    return str.length <= max;
  }

  public isBase64(str: string): boolean {
    try {
      return btoa(atob(str)) === str;
    } catch {
      return false;
    }
  }

  public sanitize(str: string): string {
    return str.replace(/[<>"'&]/g, (char) => {
      const map: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return map[char] || char;
    });
  }

  public validateCommandArgs(args: string[], min?: number, max?: number): boolean {
    if (min !== undefined && args.length < min) return false;
    if (max !== undefined && args.length > max) return false;
    return true;
  }
}
