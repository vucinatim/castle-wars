import { Blueprint } from "../types";
import { blueprintFromText } from "../blueprint-text";

// Smallest-unit grid blueprint. Rows are top -> bottom.
// Tokens:
//  '-' empty
//  'w' wood, 't' steel, 's' stone, 'g' glass
//  'p' soldier spawn
export const CASTLE_BLUEPRINT: Blueprint = blueprintFromText(`
--------w-p-w----------
--p-----wwwww----------
sssss----t-t-----------
-w-w-----t-t-----------
-w-w-----t-t-----------
-w-w---wwwwwww---------
-w-w---w-----w---------
-w-w---w-----w---------
-w-w---w-----w---p--www
tttttttw-----wwwwwwww-w
--wwwwww-----w------w-w
--w----w--p--w------w-w
--w----wwwwwww------w-w
--w-p--w-----w------w-w
--wwwwww-----w------w-w
`);
