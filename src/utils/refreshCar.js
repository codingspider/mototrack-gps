// Sizes of the running-car animation shown while a page is pull-to-refreshing, and of the clear slot it sits in.
// The page content moves down by SLOT_HEIGHT while it refreshes, so the car never covers a banner or a card.
export const CAR_WIDTH = 96;
export const CAR_HEIGHT = 54; // the animation is 400 x 225
export const CAR_MARGIN = 12; // clear space above the car and below it
export const SLOT_HEIGHT = CAR_HEIGHT + CAR_MARGIN; // the car's own margin above it is the page's normal top padding
export const MIN_SHOW_MS = 1200; // the car stays at least this long, so a very fast refresh is still seen
