import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { renderToStaticMarkup } from 'react-dom/server';

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
});
