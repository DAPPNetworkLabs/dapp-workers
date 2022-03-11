export function getScreenSize() {
  return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
}
  
export function isMobile() {
  return getScreenSize() <= 1000;
}