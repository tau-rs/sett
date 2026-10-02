import { css } from 'lit';

/**
 * The host-as-link pattern of the shell's status items and What's new lines:
 * the whole element leads to the view that owns it. Without `href` the host
 * itself is the link (`role="link"`, in the tab order, Enter clicks it); with
 * `href` the element renders an `<a>` and the host steps back.
 */
export const hostLinkStyles = css`
  :host { cursor: pointer; }
  a { color: inherit; text-decoration: none; }
  :host(:focus-visible), a:focus-visible { outline: var(--sett-stroke-lit) solid var(--sett-color-sel); outline-offset: var(--sett-stroke-hair); }
`;

/** keep the host's role and tab stop in step with `href`; call from willUpdate */
export const syncHostLink = (host: HTMLElement, href?: string) => {
  if (href) { host.removeAttribute('role'); host.removeAttribute('tabindex'); }
  else { host.setAttribute('role', 'link'); host.tabIndex = 0; }
};

/** a keydown listener for the host: Enter on the host itself is a click */
export const clickOnEnter = (e: KeyboardEvent) => {
  const host = e.currentTarget as HTMLElement;
  if (e.key === 'Enter' && e.target === host && host.getAttribute('role') === 'link') host.click();
};
