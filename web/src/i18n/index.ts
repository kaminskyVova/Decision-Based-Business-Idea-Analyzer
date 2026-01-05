import { ru } from "./ru";
import { en } from "./en";

export const dictionaries = { ru, en };
export type Lang = keyof typeof dictionaries;