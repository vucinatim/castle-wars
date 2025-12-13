import { BlueprintToken, MaterialId } from "./types";
import { EMPTY_CELL } from "./blueprint-utils";

export const materialToToken = (material: MaterialId): BlueprintToken => {
  switch (material) {
    case "wood":
      return "w";
    case "steel":
      return "t";
    case "stone":
      return "s";
    case "glass":
      return "g";
  }
};

export const emptyToken = (): BlueprintToken => EMPTY_CELL;
