export function pushNote(S: any, t: string) {
  S.notes.unshift({ t, r: 0 });
  if (S.notes.length > 20) S.notes.pop();
}
