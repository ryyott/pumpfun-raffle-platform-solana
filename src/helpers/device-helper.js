export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export function toggleBodyClass(toggle) {
  const html = document.querySelector("html");
  const body = document.querySelector("body");
  body?.classList.toggle("is-blocked", toggle);
  html?.classList.toggle("is-blocked", toggle);
}
