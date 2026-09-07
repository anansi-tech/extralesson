'use client';

import { memo, useMemo } from 'react';

/**
 * RAW HTML THAT NEVER RE-COMMITS. React compares a dangerouslySetInnerHTML
 * object by identity, so a fresh `{ __html }` on every render re-set the
 * innerHTML of the stem, the figure and every prompt on every tap and every
 * keystroke. Chrome's scroll anchoring hid a subtree above the viewport being
 * torn down for a frame; Safari has none, and jumped to the top of the page.
 * The object is made once per string, and an unchanged block is never touched.
 */
export const Html = memo(function Html({
  html,
  as: Tag = 'div',
  className,
  style,
  id,
}: {
  html: string;
  as?: 'div' | 'span' | 'p';
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}) {
  const inner = useMemo(() => ({ __html: html }), [html]);
  return <Tag id={id} className={className} style={style} dangerouslySetInnerHTML={inner} />;
});
