import { Blueprint } from "../types";

// Smallest-unit grid blueprint. Rows are top -> bottom.
// Tokens:
//  '.' empty
//  'w' wood, 't' steel, 's' stone, 'g' glass
export const CASTLE_BLUEPRINT: Blueprint = {
  rows: [
    "-------ggg-------",
    "-------g-g-------",
    "-----sssssss-----",
    "-----s-----s-----",
    "-----s-----s-----",
    "---sss-----sss---",
    "---s---------s---",
    "--ttt-------ttt--",
    "--sss-------sss--",
    "--s-s-------s-s--",
    "--sss--www--sss--",
    "---w---www---w---",
    "---wtttssstttw---",
    "----sssssssss----",
  ],
};

// Local-cell spawn positions, relative to the blueprint's top-left.
// These get translated into global grid cells at build time.
export const CASTLE_SOLDIER_SPAWNS = [
  { x: 4, y: 4 }, // above left platform
  { x: 8, y: 1 }, // above top platform
  { x: 12, y: 4 }, // above right platform
] as const;
