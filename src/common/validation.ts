/**
 * Bộ kiểm tra dữ liệu đầu vào viết tay.
 * Dự án chưa cài class-validator nên ở đây dùng helper thuần TypeScript
 * để không phải thêm dependency mới.
 */
export class Validator {
  private errors: string[] = [];

  required(value: any, label: string): this {
    if (value === undefined || value === null || String(value).trim() === '') {
      this.errors.push(`${label} không được để trống.`);
    }
    return this;
  }

  minLength(value: any, min: number, label: string): this {
    const v = String(value ?? '');
    if (v.trim() !== '' && v.length < min) {
      this.errors.push(`${label} phải có ít nhất ${min} ký tự.`);
    }
    return this;
  }

  maxLength(value: any, max: number, label: string): this {
    const v = String(value ?? '');
    if (v.length > max) {
      this.errors.push(`${label} không được vượt quá ${max} ký tự.`);
    }
    return this;
  }

  /** Kiểm tra là số và >= min */
  numberMin(value: any, min: number, label: string): this {
    const n = Number(value);
    if (Number.isNaN(n)) {
      this.errors.push(`${label} phải là một số.`);
    } else if (n < min) {
      this.errors.push(`${label} phải lớn hơn hoặc bằng ${min}.`);
    }
    return this;
  }

  email(value: any, label: string): this {
    const v = String(value ?? '').trim();
    if (v !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      this.errors.push(`${label} không đúng định dạng.`);
    }
    return this;
  }

  phone(value: any, label: string): this {
    const v = String(value ?? '').trim();
    if (v !== '' && !/^[0-9+\-\s().]{8,15}$/.test(v)) {
      this.errors.push(`${label} không đúng định dạng.`);
    }
    return this;
  }

  oneOf(value: any, allowed: string[], label: string): this {
    if (value !== undefined && value !== null && !allowed.includes(String(value))) {
      this.errors.push(`${label} không hợp lệ.`);
    }
    return this;
  }

  /** Thêm lỗi thủ công (ví dụ: trùng tên trong DB) */
  add(message: string): this {
    this.errors.push(message);
    return this;
  }

  isValid(): boolean {
    return this.errors.length === 0;
  }

  getErrors(): string[] {
    return this.errors;
  }
}

/** Chuẩn hóa chuỗi: trim, trả về undefined nếu rỗng */
export function cleanString(value: any): string | undefined {
  const v = String(value ?? '').trim();
  return v === '' ? undefined : v;
}

/** Ép về số nguyên an toàn, có giá trị mặc định */
export function toInt(value: any, fallback = 0): number {
  const n = parseInt(String(value), 10);
  return Number.isNaN(n) ? fallback : n;
}

/** Ép checkbox HTML ('on' / 'true' / '1') về boolean */
export function toBool(value: any): boolean {
  return value === 'on' || value === 'true' || value === '1' || value === true;
}
