"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
import { signInSchema, signUpSchema } from "./schemas"
import { db } from "@/drizzle/db"
import {UserTable} from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import {
  comparePasswords,
  generateSalt,
  hashPassword,
} from "../core/passwordHasher"
import { cookies } from "next/headers"
import { createUserSession, removeUserFromSession } from "../core/session"

export async function signIn(unsafeData: z.infer<typeof signInSchema>) {
  const { success, data } = signInSchema.safeParse(unsafeData)
  if (!success) {
    return "Unable to log you in"
  }

  const user = await db.query.UserTable.findFirst({
    columns: { password: true, salt: true, id: true, email: true, role: true },
    where: eq(UserTable.email, data.email),
  })

  if (user == null || user.password == null || user.salt == null) {
    return "Unable to log you in"
  }

  const isCorrectPassword = await comparePasswords({
    hashedPassword: user.password,
    password: data.password,
    salt: user.salt,
  })

  if (!isCorrectPassword) {
    return "Unable to log you in"
  }

  await createUserSession(user, await cookies())

  redirect("/")
}

export async function signUp(unsafeData: z.infer<typeof signUpSchema>) {
  const { success, data } = signUpSchema.safeParse(unsafeData)
  console.log(data)
  if (!success) {
    return "Unable to create account"
  }

  const existingUser = await db.query.UserTable.findFirst({
    where: eq(UserTable.email, data.email),
  })

  console.log(existingUser)
  if (existingUser != null) {
    return "Account already exists for this email"
  }

  try {
    const salt = generateSalt()
    const hashedPassword = await hashPassword(data.password, salt)

    const [user] = await db
      .insert(UserTable)
      .values({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        salt,
      })
      .returning({ id: UserTable.id, role: UserTable.role })

    if (user == null) {
      return "Unable to create account"
    }

    await createUserSession(user, await cookies())
  } catch {
    return "Unable to create account"
  }

  redirect("/")
}

export async function logOut() {
  await removeUserFromSession(await cookies())
  redirect("/")
}
