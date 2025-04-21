'use server'

import { ID, Query } from "node-appwrite";
import { users } from "../appwrite.config";

// Define your user type
type CreateUserParams = {
  name: string;
  email: string;
  phone: string;
};

export const createUser = async (user: CreateUserParams) => {
  try {
    const newUser = await users.create(
      ID.unique(),
      user.email,
      user.phone,
      undefined,
      user.name
    );

    return newUser;
  } catch (error: any) {
    if (error?.code === 409) {
      const documents = await users.list([
        Query.equal('email', [user.email])
      ]);

      return documents?.users?.[0];
    }

    throw new Error('Failed to create user');
  }
};
