// ** WARNING **
// If the script below is modified improperly, running it may cause irrevocable damage.
// The script below comes with absolutely no warranty. Use it at your own risk.

function doGet() {
  return HtmlService.createHtmlOutputFromFile("Index");
}

function createCalendar(
  calendarName,
  timeZone,
  holidayCalendar,
  holidayExceptions,
  halfDays,
  extraHolidays,
  startMonth,
  endMonth,
  dryRun
) {
  // Create a new calendar
  if (!dryRun) {
    var calendar = CalendarApp.createCalendar(calendarName); // built-in function

    // Set its time zone
    calendar.setTimeZone(timeZone);
  }

  // Define the words to cycle through
  var words = ["J Day", "I Day", "A Day", "Y Day", "O Day", "U Day"];

  // Define the start and end months
  var startMonth = parseInt(startMonth);
  var endMonth = parseInt(endMonth);
  var year = new Date().getFullYear(); // Current year

  // Split strings into lists of dates
  holidayExceptions = holidayExceptions.split(", ");
  for (var i = 0; i < holidayExceptions.length; i++) {
    holidayExceptions[i] = new Date(holidayExceptions[i]);
  }

  halfDays = halfDays.split(", ");
  for (var j = 0; j < halfDays.length; j++) {
    halfDays[j] = new Date(halfDays[j]);
  }

  extraHolidays = extraHolidays.split(", ");
  for (var k = 0; k < extraHolidays.length; k++) {
    extraHolidays[k] = new Date(extraHolidays[k]);
  }

  // Get the holidays starting the current year
  var holidays = getHolidays(
    year,
    holidayCalendar,
    holidayExceptions,
    extraHolidays
  );

  // Event counter
  var eventIndex = 0;

  // Allow roll over
  if (startMonth > endMonth) {
    endMonth += 12;
  }

  var firstEvent = true; // for first event, to which subsequent events will be chained
  var eventSeries = ""; // for chaining events

  // Loop through each month
  for (var month = startMonth; month <= endMonth; month++) {
    // Determine the number of days in the month
    if (month <= 12) {
      var daysInMonth = new Date(year, month, 0).getDate();
    } else {
      // roll over
      var daysInMonth = new Date(year + 1, month % 12, 0).getDate();
    }

    // Loop through each day of the month
    for (var day = 1; day <= daysInMonth; day++) {
      if (month <= 12) {
        var date = new Date(year, month - 1, day);
      } else {
        // roll over
        var date = new Date(year + 1, (month % 12) - 1, day);
      }

      // Check if the day is a weekend (Saturday or Sunday)
      if (date.getDay() == 0 || date.getDay() == 6) {
        continue;
      }

      // Check if the day is a holiday
      if (isHoliday(date, holidays)) {
        continue;
      }

      // Create an event with the current word
      var word = words[eventIndex % words.length];
      if (!dryRun) {
        createEvent();
      }

      // function nested to align with Web app for adding events
      function createEvent() {
        if (firstEvent) {
          eventSeries = calendar.createAllDayEventSeries(
            word,
            date,
            CalendarApp.newRecurrence().addDate(date)
          );
          firstEvent = false;
        } // chain subsequent event to first event
        else
          eventSeries.setRecurrence(
            CalendarApp.newRecurrence().addDate(date),
            date
          );
        return null;
      }

      // Log which words were created
      Logger.log("Created " + word + " on " + date + "!");

      // Unless an event is a half-day, increment the event counter
      var halfDay = "no";
      for (var l = 0; l < halfDays.length; l++) {
        if (date.toDateString() === halfDays[l].toDateString()) {
          halfDay = "yes";
          continue;
        }
      }
      if (halfDay === "yes") {
        halfDay = "no"; // reset
        // then skip
      } else {
        eventIndex++;
      }
    }
  }
  return "Calendar created! Go to your Google Calendar...";
}

// Function to check if a date is a holiday
function isHoliday(date, holidays) {
  for (var m = 0; m < holidays.length; m++) {
    if (holidays[m].getTime() === date.getTime()) {
      return true;
    }
  }
  return false;
}

// Function to get holidays
function getHolidays(year, holidayCalendar, holidayExceptions, extraHolidays) {
  var holidays = extraHolidays;
  var calendar = CalendarApp.getCalendarById(holidayCalendar);
  var start = new Date(year, 0, 1); // Start from January 1st of current year
  var end = new Date(year + 1, 12, 31); // End on December 31st of next year (roll over)

  var events = calendar.getEvents(start, end);

  // Exempt these holidays
  var match = false;
  for (var n = 0; n < events.length; n++) {
    for (var o = 0; o < holidayExceptions.length; o++) {
      if (
        events[n].getAllDayStartDate().toDateString() ===
        holidayExceptions[o].toDateString()
      ) {
        match = true;
        continue;
      }
    }
    if (match === true) {
      match = false; // reset
      // then skip
    } else {
      holidays.push(events[n].getAllDayStartDate());
    }
  }

  return holidays;
}
