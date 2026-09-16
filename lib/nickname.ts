// 昵称校验：登录账号是昵称，不接受手机号。前后端共用同一份规则。
export const PHONE_HINT = "请不要使用手机号，改用昵称";

const MIN_LENGTH = 2;
const MAX_LENGTH = 20;

/** 去掉空格、连字符、圆括号后，像手机号就返回 true（13800000001、+8613800000001、138 0000 0001 都算） */
export function isPhoneLike(value: string): boolean {
  const normalized = value.replace(/[\s\-()]/g, "");
  return /^\+?\d{7,}$/.test(normalized);
}

/** 返回错误信息，通过则返回 null */
export function validateNickname(value: string): string | null {
  const nickname = value.trim();

  if (!nickname) {
    return "请输入昵称";
  }

  if (nickname.length < MIN_LENGTH || nickname.length > MAX_LENGTH) {
    return `昵称长度请控制在 ${MIN_LENGTH}-${MAX_LENGTH} 个字`;
  }

  if (isPhoneLike(nickname)) {
    return PHONE_HINT;
  }

  return null;
}
