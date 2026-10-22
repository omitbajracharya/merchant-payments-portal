import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'mask',
  standalone: true,
})
export class MaskPipe implements PipeTransform {
  transform(
    value: string | number | null | undefined,
    visibleTrailingChars: number = 4,
    maskChar: string = '•'
  ): string {
    if (!value) return '—';
    const str = String(value).trim();
    if (str.length <= visibleTrailingChars) {
      return maskChar.repeat(str.length);
    }
    const maskedPortion = maskChar.repeat(str.length - visibleTrailingChars);
    const visiblePortion = str.slice(-visibleTrailingChars);
    return `${maskedPortion}${visiblePortion}`;
  }
}

