import { EventInput } from '@fullcalendar/core';

let eventGuid = 0;
const TODAY_STR = new Date().toISOString().replace(/T.*$/, ''); // YYYY-MM-DD of today

export const INITIAL_EVENTS: EventInput[] = [
  {
    id: createEventId(),
    title: 'All-day event',
    start: TODAY_STR,
    backgroundColor: '#FFB347'
  },
  {
    id: createEventId(),
    title: 'Timed event 1',
    start: TODAY_STR + 'T00:00:00',
    end: TODAY_STR + 'T03:00:00',
    backgroundColor: '#AEC6CF'
  },
  {
    id: createEventId(),
    title: 'Timed event 2',
    start: TODAY_STR + 'T14:00:00',
    end: TODAY_STR + 'T15:00:00',
    backgroundColor:  '#77DD77',
    color: '#AEC6CF'
  }
];

export function createEventId() {
  return String(eventGuid++);
}