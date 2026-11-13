/**
 * Utility to convert Thai keyboard layout characters to English/Digits.
 * When a barcode scanner gun scans numbers while the operating system's
 * keyboard language is set to Thai (Kedmanee layout), characters like
 * "คคถจ-จภจๅถจต" are typed instead of "8850304015079".
 */
const THAI_KBD_MAP: Record<string, string> = {
  // Number row (Digits 0-9)
  'ๅ': '1', '+': '1', '๑': '1',
  '/': '2', '๒': '2',
  '-': '3', '”': '3', '๓': '3',
  'ภ': '4', 'ฤ': '4', '๔': '4',
  'ถ': '5', '๕': '5',
  'ุ': '6', 'ู': '6', '๖': '6',
  'ึ': '7', '฿': '7', '๗': '7',
  'ค': '8', '๘': '8',
  'ต': '9', '๙': '9',
  'จ': '0', '๐': '0',

  // Common barcode letter characters
  'ๆ': 'q', 'ไ': 'w', 'ำ': 'e', 'พ': 'r', 'ะ': 't', 'ั': 'y', 'ี': 'u', 'ร': 'i', 'น': 'o', 'ย': 'p',
  'ฟ': 'a', 'ห': 's', 'ก': 'd', 'ด': 'f', 'เ': 'g', '้': 'h', '่': 'j', 'า': 'k', 'ส': 'l',
  'ผ': 'z', 'ป': 'x', 'แ': 'c', 'อ': 'v', 'ิ': 'b', 'ื': 'n', 'ท': 'm',
  'Q': 'Q', 'W': 'W', 'E': 'E', 'R': 'R', 'T': 'T', 'Y': 'Y', 'U': 'U', 'I': 'I', 'O': 'O', 'P': 'P',
  'A': 'A', 'S': 'S', 'D': 'D', 'F': 'F', 'G': 'G', 'H': 'H', 'J': 'J', 'K': 'K', 'L': 'L',
  'Z': 'Z', 'X': 'X', 'C': 'C', 'V': 'V', 'B': 'B', 'N': 'N', 'M': 'M'
};

export function convertThaiKeyboardToLatin(text: string): string {
  if (!text) return '';
  return text
    .split('')
    .map(char => THAI_KBD_MAP[char] ?? char)
    .join('');
}
