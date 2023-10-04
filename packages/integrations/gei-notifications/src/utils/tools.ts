export const removeDuplicatesFromArray = <T>(arr1: T[]): T[] => arr1.filter((e, pos, self) => self.indexOf(e) == pos);

export const sliceByArray = <T>(arr1: T[], arr2: T[]): T[] => arr1.filter((e) => arr2.indexOf(e));
