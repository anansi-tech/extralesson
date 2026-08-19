import { describe, expect, it } from 'vitest';
import { splitStoredAnswer } from '@/lib/study/attempt-answers';

// A revisited question is rebuilt from its attempt, so reading the stored
// answer back has to be exact.
describe('reading a stored attempt back', () => {
  it('splits on the question\'s own slot refs', () => {
    expect(splitStoredAnswer('(a.i) 42; (b.ii) 7', ['a.i', 'b.ii'])).toEqual({ 'a.i': '42', 'b.ii': '7' });
  });

  it('keeps a semicolon that belongs to the answer', () => {
    // A set of roots is written with a semicolon on purpose; splitting on "; "
    // would have turned one answer into two and marked the second slot wrong.
    expect(splitStoredAnswer('(a.i) x = -1/3; x = 2; (b.i) 5', ['a.i', 'b.i'])).toEqual({
      'a.i': 'x = -1/3; x = 2',
      'b.i': '5',
    });
  });

  it('survives a slot left blank', () => {
    expect(splitStoredAnswer('(a.i) ; (b.i) 5', ['a.i', 'b.i'])).toEqual({ 'a.i': '', 'b.i': '5' });
  });

  it('ignores refs the attempt does not carry', () => {
    expect(splitStoredAnswer('(a.i) 4', ['a.i', 'c.iii'])).toEqual({ 'a.i': '4' });
  });
});
