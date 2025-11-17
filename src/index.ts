import type { Clue, PublisherClue } from "./lib/find-program";
import * as findProgramFunction from "./lib/find-program";

export const findProgram = findProgramFunction.findProgram;
export const setExternalVBSLocation = findProgramFunction.setExternalVBSLocation;
export type { Clue, PublisherClue };