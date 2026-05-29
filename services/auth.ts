import { hash, compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function register(phone: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    throw new Error("该手机号已注册");
  }

  const hashedPassword = await hash(password, 12);
  const user = await prisma.user.create({
    data: { phone, password: hashedPassword },
  });

  await createSession(user.id);
  return user;
}

export async function login(phone: string, password: string) {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    throw new Error("手机号或密码错误");
  }

  const valid = await compare(password, user.password);
  if (!valid) {
    throw new Error("手机号或密码错误");
  }

  await createSession(user.id);
  return user;
}
