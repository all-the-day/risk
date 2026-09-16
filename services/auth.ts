import { hash, compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function register(nickname: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { nickname } });
  if (existing) {
    throw new Error("该昵称已被使用");
  }

  const hashedPassword = await hash(password, 12);
  const user = await prisma.user.create({
    data: { nickname, password: hashedPassword },
  });

  await createSession(user.id);
  return user;
}

export async function login(nickname: string, password: string) {
  const user = await prisma.user.findUnique({ where: { nickname } });
  if (!user) {
    throw new Error("昵称或密码错误");
  }

  const valid = await compare(password, user.password);
  if (!valid) {
    throw new Error("昵称或密码错误");
  }

  await createSession(user.id);
  return user;
}
