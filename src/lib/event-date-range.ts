export type EventDateRange={from:string|null;to:string|null};

const isCalendarDate=(value:string|null)=>value===null||(/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(`${value}T00:00:00.000Z`).toISOString().slice(0,10)===value);

export function parseEventDateRange(from:string|null,to:string|null):EventDateRange|null{
 if(!isCalendarDate(from)||!isCalendarDate(to)||(from&&to&&from>=to))return null;
 return {from,to};
}
