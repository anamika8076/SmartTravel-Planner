// Shared page scroll lock. Several dialogs can be open at once (e.g. the plan
// modal plus a confirm dialog); the page scrolls again only when all have closed.
let locks = 0;

export function lockScroll() {
  locks += 1;
  if (locks === 1) document.body.style.overflow = 'hidden';
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks = Math.max(0, locks - 1);
    if (locks === 0) document.body.style.overflow = '';
  };
}
