// Kiểm tra dữ liệu điểm gửi lên. Tách riêng khỏi worker.js vì file entry của Worker
// chỉ được export default (các export khác bị workerd coi là entrypoint và báo lỗi).

export const MAX_SCORE = 100000;
export const MAX_LEVELS = 3;
export const MAX_NAME_LENGTH = 16;

// Làm sạch tên: bỏ ký tự điều khiển và < >, gộp khoảng trắng, cắt độ dài.
export function sanitizeName(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME_LENGTH);
}

// Trả về { value } nếu hợp lệ, hoặc { error } nếu sai.
export function validateScore(body) {
  if (!body || typeof body !== 'object') return { error: 'Dữ liệu không hợp lệ' };
  const name = sanitizeName(body.name);
  if (!name) return { error: 'Tên không được để trống' };
  const { score, levels } = body;
  if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) {
    return { error: `Điểm phải là số nguyên từ 0 đến ${MAX_SCORE}` };
  }
  if (!Number.isInteger(levels) || levels < 0 || levels > MAX_LEVELS) {
    return { error: `Số màn phải từ 0 đến ${MAX_LEVELS}` };
  }
  return { value: { name, score, levels } };
}
