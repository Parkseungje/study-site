/** note.body 는 VARCHAR(500). 넘치면 DB 가 거부하므로 화면에서 먼저 막는다. */
export const NOTE_MAX = 500;

export type NoteResult = { ok: true } | { ok: false; message: string };
