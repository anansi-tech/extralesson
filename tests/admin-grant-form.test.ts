import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('next/cache', () => ({ revalidatePath() {} }));
vi.mock('next/navigation', async (orig) => ({
  ...(await orig<typeof import('next/navigation')>()),
  redirect: (url: string) => { throw new Error(`REDIRECT ${url}`); },
}));
vi.mock('@/lib/auth/session', () => ({ requireAdmin: async () => ({ student_id: 'a', email: 'ops@example.com', role: 'admin' }) }));

// The way to grant an account is not a row's control: it belongs to the page,
// so a payment with no matching account has somewhere to go even when no
// search has been made and every listed account is already paid.
let mongod: MongoMemoryServer;
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
}, 120000);
afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

const page = async (params: Record<string, string> = {}) => {
  const { default: AccessPage } = await import('@/app/admin/access/page');
  return renderToStaticMarkup(await AccessPage({ searchParams: Promise.resolve(params) }));
};

describe('/admin/access grants without a row', () => {
  it('renders the form with no search, no students and no unmatched payments', async () => {
    const html = await page();
    expect(html).toContain('Grant access');
    // A server action is not serialized into static markup, so the form is found by its fields.
    const form = /<form[^>]*>(?:(?!<\/form>)[\s\S])*?name="email"[\s\S]*?<\/form>/.exec(html);
    expect(form, 'the standalone grant form').not.toBeNull();
    expect(form![0]).toContain('name="sitting"');
    expect(form![0]).toContain('name="class"');
    expect(form![0]).toContain('name="reason"');
    // No row supplies an id here: the address is the key.
    expect(form![0]).not.toContain('name="id"');
    // It sits above the lists, under where an unmatched payment is reported.
    expect(html.indexOf('Grant access')).toBeLessThan(html.indexOf('Delete an account'));
  }, 60000);

  it('says when an address had no account, and never claims a grant', async () => {
    const html = await page({ ungranted: 'nobody@example.com' });
    expect(html).toContain('nobody@example.com');
    expect(html).toContain('nothing was granted');
    expect(html).not.toContain('Granted:');
  }, 60000);

  it('opens with no sitting chosen, because none is the account\u2019s yet', async () => {
    const html = await page();
    const select = /<select[^>]*name="sitting"[\s\S]*?<\/select>/.exec(html)![0];
    // The placeholder is the selected option; nothing real is preselected.
    expect(select).toMatch(/<option value="" [^>]*selected/);
    expect(select).not.toMatch(/<option value="(jan|may)[^"]*"[^>]*selected/);
  }, 60000);
});

// THE SITTING IS THE ACCOUNT'S. Both halves are server-side and testable: the
// lookup the form preselects from, and the refusal when nothing was chosen.
describe('the sitting a grant is for', () => {
  const student = async (email: string, exam_sitting: string) => {
    const { Student } = await import('@/lib/db');
    return Student.create({ email, name: 'Kiara', exam_sitting, target_modules: [1, 2, 3], password_hash: 'x', syllabus_mode: exam_sitting === 'jan-2027' ? 'legacy-jan' : 'modular-2027' });
  };

  it('is looked up from the address, and is null when no account matches', async () => {
    const { sittingFor } = await import('@/app/admin/access/actions');
    await student('jan@example.com', 'jan-2027');

    expect(await sittingFor('jan@example.com')).toBe('jan-2027');
    expect(await sittingFor('  JAN@example.com  '), 'typed as it comes').toBe('jan-2027');
    expect(await sittingFor('nobody@example.com')).toBeNull();
  }, 60000);

  it('a grant with no sitting is refused, and writes nothing', async () => {
    const { grantAccess } = await import('@/app/admin/access/actions');
    const { Student } = await import('@/lib/db');
    await student('nositting@example.com', 'may-june-2027');
    const form = new FormData();
    form.set('email', 'nositting@example.com');
    form.set('sitting', '');
    form.set('class', 'comp');
    form.set('reason', 'a good reason');

    await expect(grantAccess(form)).rejects.toThrow(/REDIRECT.*nositting=1/);
    const after = await Student.findOne({ email: 'nositting@example.com' }).select('access').lean<{ access?: unknown } | null>();
    expect(after?.access ?? null, 'nothing granted').toBeNull();
  }, 60000);
});
