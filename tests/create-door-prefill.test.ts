import { describe, expect, it } from 'vitest';
import { createElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LoginPage from '@/app/study/login/page';
import LoginForm from '@/app/study/login/login-form';

/** The LoginForm element the page returns, wherever it sits in the tree. */
function findForm(node: ReactNode): ReactElement | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findForm(child);
      if (found) return found;
    }
    return null;
  }
  if (!isValidElement(node)) return null;
  if (node.type === LoginForm) return node;
  return findForm((node.props as { children?: ReactNode }).children ?? null);
}
const door = async (params: Record<string, string>) => findForm(await LoginPage({ searchParams: Promise.resolve(params) }));

// The link out of a failed sign-in is a navigation INSIDE /study/login, so
// React reuses the form: the address only appeared after a refresh, because a
// default value and an initial state are read at mount and never again.
describe('the create door, arrived at from a failed sign-in', () => {
  it('remounts the form, so a different address is a different form', async () => {
    const first = await door({ new: '1', email: 'kiara@example.com' });
    const second = await door({ new: '1', email: 'someone@example.com' });

    expect(first?.key).toBeTruthy();
    expect(first?.key).not.toBe(second?.key);
  });

  it('remounts it when the door changes under the same address', async () => {
    const signin = await door({ email: 'kiara@example.com' });
    const create = await door({ new: '1', email: 'kiara@example.com' });

    expect(signin?.key).not.toBe(create?.key);
    expect(signin?.props).toMatchObject({ door: 'signin' });
    expect(create?.props).toMatchObject({ door: 'create' });
  });

  it('carries the typed address into the field, capped at the length of an address', async () => {
    const created = await door({ new: '1', email: 'kiara@example.com' });
    expect(created?.props).toMatchObject({ initial: { email: 'kiara@example.com' } });

    const long = `${'a'.repeat(300)}@example.com`;
    const capped = await door({ new: '1', email: long });
    expect((capped?.props as { initial: { email: string } }).initial.email).toHaveLength(254);

    // And with no address the door opens empty rather than with an empty string.
    expect((await door({ new: '1' }))?.props).toMatchObject({ initial: undefined });
  });

  it('shows the address in the field once it is mounted', () => {
    const html = renderToStaticMarkup(createElement(LoginForm, { door: 'create', initial: { email: 'kiara@example.com' } }));
    expect(html).toMatch(/<input[^>]*name="email"[^>]*value="kiara@example.com"/);
  });
});
