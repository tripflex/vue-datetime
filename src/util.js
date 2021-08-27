import { DateTime, Info, Settings } from 'luxon'
import FlowManager from './FlowManager'

export function capitalize (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function datetimeFromISO (string) {
  const datetime = DateTime.fromISO(string).toUTC()

  return datetime.isValid ? datetime : null
}

export function monthDays (year, month, weekStart) {
  const monthDate = DateTime.local(year, month, 1)
  let firstDay = monthDate.weekday - weekStart

  if (firstDay < 0) {
    firstDay += 7
  }
  let lastDay = (weekStart - monthDate.weekday - monthDate.daysInMonth) % 7
  if (lastDay < 0) {
    lastDay += 7
  }

  return Array.apply(null, Array(monthDate.daysInMonth + firstDay + lastDay))
    .map((value, index) =>
      (index + 1 <= firstDay || index >= firstDay + monthDate.daysInMonth) ? null : (index + 1 - firstDay)
    )
}

export function monthDayIsDisabled (disabledDates, disabledDays, minDate, maxDate, year, month, day) {
  const date = DateTime.fromObject({ year, month, day }, {zone: 'UTC'})

  if( disabledDays && disabledDays.length > 0 ){
     // Use set for faster lookups
     const ddaysSet = new Set( disabledDays )
     if( ddaysSet.has( date.weekday ) ){
       return true
     }
  }

  if( disabledDates && disabledDates.length > 0 ){
    const ddatesSet = new Set( disabledDates )
    const isoDate = date.toISODate()
    const isoDateNoYear = isoDate.replace( `${date.year}-`, '' )
    console.log( isoDate, isoDateNoYear )
    if( ddatesSet.has( isoDate ) || ddatesSet.has( isoDateNoYear ) ){
      return true
    }
  }

  minDate = minDate ? startOfDay(minDate.setZone('UTC', { keepLocalTime: true })) : null
  maxDate = maxDate ? startOfDay(maxDate.setZone('UTC', { keepLocalTime: true })) : null

  return (minDate && date < minDate) ||
         (maxDate && date > maxDate)
}

export function monthIsDisabled (minDate, maxDate, year, month) {
  return (minDate && minDate > DateTime.utc(year, month, DateTime.utc(year, month).daysInMonth)) ||
         (maxDate && maxDate < DateTime.utc(year, month, 1))
}

export function yearIsDisabled (minDate, maxDate, year) {
  const minYear = minDate ? minDate.year : null
  const maxYear = maxDate ? maxDate.year : null

  return (minYear && year < minYear) ||
         (maxYear && year > maxYear)
}

export function timeHoursComponentIsDisabled( min, max, hour, currentMinute, disabledTimes ) {

  if ( disabledTimes && disabledTimes.length > 0 ) {
    let shouldDisable = false

    for( const timeRange of disabledTimes ){
      // 0:59-14:59
      const times = timeRange.split('-')

      // 0:59
      const start = times[0].split(':')
      const startHour = parseInt( start[0] ) // 0
      const startMinute = parseInt( start[1] ) // 59

      // 14:59
      const end = times[1].split( ':' )
      const endHour = parseInt( end[0] ) // 14
      const endMinute = parseInt( end[1] ) // 59

      if( ( hour === startHour && startMinute === 0 ) || ( hour === endHour && endMinute === 59 ) || ( hour > startHour && hour < endHour )){
        shouldDisable = true
        break
      }

    }

    if( shouldDisable ){
      return true
    }
  }

 // console.log( 'timeHoursComponentIsDisabled', min, max, hour, currentMinute, disabledTimes )

  return (min !== null && hour < min) ||
         (max !== null && hour > max)
}

export function timeMinutesComponentIsDisabled( min, max, minute, currentHour, disabledTimes ) {

  if ( disabledTimes && disabledTimes.length > 0 ) {
    let shouldDisable = false

    for ( const timeRange of disabledTimes ) {
      // 2:59-14:59
      const times = timeRange.split( '-' )

      // 2:59
      const start = times[ 0 ].split( ':' )
      const startHour = parseInt( start[ 0 ] ) // 2
      const startMinute = parseInt( start[ 1 ] ) // 59

      // 14:59
      const end = times[ 1 ].split( ':' )
      const endHour = parseInt( end[ 0 ] ) // 14
      const endMinute = parseInt( end[ 1 ] ) // 59

      if( currentHour === startHour && minute >= startMinute ){
        shouldDisable = true
        break
      }

      if( currentHour === endHour && minute <= endMinute ){
        shouldDisable = true
        break
      }

      if( currentHour > startHour && currentHour < endHour ){
        shouldDisable = true
        break
      }

    }

    if ( shouldDisable ) {
      return true
    }
  }

  return (min !== null && minute < min) ||
         (max !== null && minute > max)
}

export function timeComponentIsDisabled ( min, max, component ) {
  return (min !== null && component < min) ||
         (max !== null && component > max)
}

export function weekdays (weekStart) {
  if (--weekStart < 0) {
    weekStart = 6
  }

  let weekDays = Info.weekdays('short').map(weekday => capitalize(weekday))

  weekDays = weekDays.concat(weekDays.splice(0, weekStart))

  return weekDays
}

export function months () {
  return Info.months().map(month => capitalize(month))
}

export function hours (step) {
  return Array.apply(null, Array(Math.ceil(24 / step))).map((item, index) => index * step)
}

export function minutes (step) {
  return Array.apply(null, Array(Math.ceil(60 / step))).map((item, index) => index * step)
}

export function years (current) {
  return Array.apply(null, Array(201)).map((item, index) => current - 100 + index)
}

export function pad (number) {
  return number < 10 ? '0' + number : number
}

export function startOfDay (datetime) {
  return datetime.startOf('day')
}

export function createFlowManager (flow) {
  return new FlowManager(flow, 'end')
}

export function createFlowManagerFromType (type) {
  let flow = []

  switch (type) {
    case 'datetime':
      flow = ['date', 'time']
      break
    case 'time':
      flow = ['time']
      break
    default:
      flow = ['date']
  }

  return new FlowManager(flow, 'end')
}

export function weekStart () {
  let weekstart

  try {
    weekstart = require('weekstart/package.json').version ? require('weekstart') : null
  } catch (e) {
    weekstart = window.weekstart
  }

  const firstDay = weekstart ? weekstart.getWeekStartByLocale(Settings.defaultLocale) : 1

  return firstDay === 0 ? 7 : firstDay
}
